const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Fonction pour extraire le texte d'un bloc
function extractTextFromBlock(block) {
  const texts = [];
  
  // Gestion des différents types de blocs
  const textTypes = ['paragraph', 'heading_1', 'heading_2', 'heading_3', 
                     'bulleted_list_item', 'numbered_list_item', 'to_do', 
                     'toggle', 'quote', 'callout'];
  
  for (const type of textTypes) {
    if (block[type] && block[type].rich_text) {
      const text = block[type].rich_text
        .map(rt => rt.plain_text)
        .join('');
      if (text) texts.push(text);
    }
  }
  
  return texts.join('\n');
}

// Fonction pour lire tout le contenu d'une page récursivement
async function readFullPageContent(pageId, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];
  
  try {
    const blocks = [];
    let cursor;
    
    do {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
        page_size: 100,
      });
      
      for (const block of response.results) {
        const text = extractTextFromBlock(block);
        if (text) {
          blocks.push({
            id: block.id,
            type: block.type,
            text: text
          });
        }
        
        // Récursion pour les blocs avec enfants
        if (block.has_children) {
          const children = await readFullPageContent(
            block.id, 
            maxDepth, 
            currentDepth + 1
          );
          blocks.push(...children);
        }
      }
      
      cursor = response.next_cursor;
    } while (cursor);
    
    return blocks;
  } catch (error) {
    console.error('Error reading page content:', error);
    return [];
  }
}

// Fonction pour résumer intelligemment un contenu long
function intelligentSummary(blocks, maxLength = 3000) {
  // Grouper par sections (headings)
  const sections = [];
  let currentSection = { title: 'Introduction', content: [] };
  
  for (const block of blocks) {
    if (block.type.startsWith('heading_')) {
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { 
        title: block.text, 
        content: [] 
      };
    } else {
      currentSection.content.push(block.text);
    }
  }
  
  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }
  
  // Créer un résumé structuré
  let summary = '';
  let currentLength = 0;
  
  for (const section of sections) {
    const sectionText = `\n## ${section.title}\n${section.content.join('\n\n')}`;
    
    if (currentLength + sectionText.length < maxLength) {
      summary += sectionText;
      currentLength += sectionText.length;
    } else {
      // Tronquer intelligemment
      const remaining = maxLength - currentLength;
      const preview = section.content.join('\n\n').substring(0, remaining);
      summary += `\n## ${section.title}\n${preview}\n\n[... Suite tronquée ...]`;
      break;
    }
  }
  
  return summary;
}

// Handler principal
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { query, limit = 10 } = req.method === 'GET' ? req.query : req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Missing query parameter' 
      });
    }
    
    // 1. Recherche dans Notion
    const searchResponse = await notion.search({
      query: query,
      page_size: parseInt(limit),
      filter: {
        property: 'object',
        value: 'page'
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time'
      }
    });
    
    // 2. Pour chaque résultat, lire le contenu complet
    const enrichedResults = await Promise.all(
      searchResponse.results.map(async (page) => {
        try {
          // Lire tout le contenu de la page
          const blocks = await readFullPageContent(page.id);
          const fullText = blocks.map(b => b.text).join('\n\n');
          
          // Si trop long, résumer intelligemment
          const content = fullText.length > 5000 
            ? intelligentSummary(blocks, 3000)
            : fullText;
          
          return {
            id: page.id,
            url: page.url,
            title: page.properties?.title?.title?.[0]?.plain_text || 
                   page.properties?.Name?.title?.[0]?.plain_text ||
                   'Sans titre',
            last_edited: page.last_edited_time,
            content: content,
            content_length: fullText.length,
            truncated: fullText.length > 5000
          };
        } catch (error) {
          console.error(`Error reading page ${page.id}:`, error);
          return {
            id: page.id,
            url: page.url,
            title: 'Erreur de lecture',
            error: error.message
          };
        }
      })
    );
    
    return res.status(200).json({
      success: true,
      query: query,
      results_count: enrichedResults.length,
      results: enrichedResults
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
