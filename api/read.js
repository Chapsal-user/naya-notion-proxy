const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Réutilisation des fonctions de search.js
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
    const { page_id, section } = req.method === 'GET' ? req.query : req.body;
    
    if (!page_id) {
      return res.status(400).json({ 
        error: 'Missing page_id parameter' 
      });
    }
    
    // Normaliser l'ID (enlever les tirets si présents)
    const normalizedId = page_id.replace(/-/g, '');
    
    // 1. Récupérer les métadonnées de la page
    const page = await notion.pages.retrieve({ 
      page_id: normalizedId 
    });
    
    // 2. Lire tout le contenu
    const blocks = await readFullPageContent(normalizedId);
    
    // 3. Organiser par sections
    const sections = [];
    let currentSection = { 
      title: 'Introduction', 
      level: 0,
      content: [] 
    };
    
    for (const block of blocks) {
      if (block.type.startsWith('heading_')) {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        
        const level = parseInt(block.type.split('_')[1]);
        currentSection = { 
          title: block.text,
          level: level,
          content: [] 
        };
      } else {
        currentSection.content.push(block.text);
      }
    }
    
    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }
    
    // 4. Si une section spécifique est demandée
    let filteredSections = sections;
    if (section) {
      filteredSections = sections.filter(s => 
        s.title.toLowerCase().includes(section.toLowerCase())
      );
    }
    
    // 5. Construire la réponse
    const fullContent = filteredSections
      .map(s => {
        const heading = '#'.repeat(s.level || 1);
        return `${heading} ${s.title}\n\n${s.content.join('\n\n')}`;
      })
      .join('\n\n---\n\n');
    
    return res.status(200).json({
      success: true,
      page: {
        id: page.id,
        url: page.url,
        title: page.properties?.title?.title?.[0]?.plain_text || 
               page.properties?.Name?.title?.[0]?.plain_text ||
               'Sans titre',
        last_edited: page.last_edited_time,
        created: page.created_time
      },
      sections_count: filteredSections.length,
      total_sections: sections.length,
      filtered_by: section || null,
      content: fullContent,
      content_length: fullContent.length
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
