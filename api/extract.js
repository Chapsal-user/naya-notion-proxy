const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

function extractTextFromBlock(block) {
  const texts = [];
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { doc_name, keywords } = req.method === 'GET' ? req.query : req.body;
    
    if (!doc_name || !keywords) {
      return res.status(400).json({ 
        error: 'Missing doc_name or keywords parameter',
        usage: {
          doc_name: 'Name or partial name of the document to search',
          keywords: 'Keywords to find within the document (comma-separated)'
        }
      });
    }
    
    // 1. Rechercher le document
    const searchResponse = await notion.search({
      query: doc_name,
      filter: {
        property: 'object',
        value: 'page'
      }
    });
    
    if (searchResponse.results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        searched: doc_name
      });
    }
    
    const page = searchResponse.results[0];
    
    // 2. Lire le contenu complet
    const blocks = await readFullPageContent(page.id);
    
    // 3. Parser les mots-clés
    const keywordsList = keywords.split(',').map(k => k.trim().toLowerCase());
    
    // 4. Extraire les sections pertinentes
    const relevantSections = [];
    let currentSection = null;
    
    for (const block of blocks) {
      const textLower = block.text.toLowerCase();
      
      // Démarrer une nouvelle section sur les headings
      if (block.type.startsWith('heading_')) {
        if (currentSection && currentSection.content.length > 0) {
          relevantSections.push(currentSection);
        }
        currentSection = {
          title: block.text,
          content: [],
          matches: []
        };
      }
      
      // Vérifier si le texte contient un des mots-clés
      const matchedKeywords = keywordsList.filter(keyword => 
        textLower.includes(keyword)
      );
      
      if (matchedKeywords.length > 0) {
        if (!currentSection) {
          currentSection = {
            title: 'Introduction',
            content: [],
            matches: []
          };
        }
        currentSection.content.push(block.text);
        currentSection.matches.push(...matchedKeywords);
      }
    }
    
    if (currentSection && currentSection.content.length > 0) {
      relevantSections.push(currentSection);
    }
    
    // 5. Formater la réponse
    const extractedContent = relevantSections
      .map(section => {
        const uniqueMatches = [...new Set(section.matches)];
        return `## ${section.title}\n**Mots-clés trouvés:** ${uniqueMatches.join(', ')}\n\n${section.content.join('\n\n')}`;
      })
      .join('\n\n---\n\n');
    
    return res.status(200).json({
      success: true,
      document: {
        id: page.id,
        title: page.properties?.title?.title?.[0]?.plain_text || 
               page.properties?.Name?.title?.[0]?.plain_text ||
               'Sans titre',
        url: page.url
      },
      search: {
        keywords: keywordsList,
        sections_found: relevantSections.length
      },
      extracted_content: extractedContent,
      content_length: extractedContent.length
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
