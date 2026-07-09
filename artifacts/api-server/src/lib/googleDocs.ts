import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-docs',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Docs not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleDocsClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.docs({ version: 'v1', auth: oauth2Client });
}

export interface JournalEntry {
  date: string;
  whatBuilt: string;
  whatBroke: string;
  tomorrowTarget: string;
  gratitude?: string;
}

export async function createDraftYourLegendDoc(
  title: string,
  entries: JournalEntry[],
  userName: string
): Promise<{ documentId: string; documentUrl: string }> {
  const docs = await getUncachableGoogleDocsClient();
  
  const createResponse = await docs.documents.create({
    requestBody: {
      title: title || `Draft Your Legend - ${userName}'s Recovery Journey`
    }
  });

  const documentId = createResponse.data.documentId!;

  const requests: any[] = [];
  let currentIndex = 1;

  const addText = (text: string, bold = false, heading = false) => {
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: text
      }
    });
    
    if (bold || heading) {
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + text.length
          },
          textStyle: {
            bold: bold,
            fontSize: heading ? { magnitude: 18, unit: 'PT' } : undefined
          },
          fields: bold && heading ? 'bold,fontSize' : 'bold'
        }
      });
    }
    
    currentIndex += text.length;
  };

  addText(`DRAFT YOUR LEGEND\n`, true, true);
  addText(`${userName}'s Recovery Journey\n\n`, false, false);
  addText(`"Every day you show up, you write another line of your legend."\n`, false, false);
  addText(`— The Stroked-Out Sasquatch\n\n`, false, false);
  addText(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`, false, false);

  for (const entry of entries) {
    addText(`📅 ${entry.date}\n\n`, true, false);
    
    addText(`What I Built Today:\n`, true, false);
    addText(`${entry.whatBuilt || 'No entry'}\n\n`, false, false);
    
    addText(`What Broke (And How I'll Fix It):\n`, true, false);
    addText(`${entry.whatBroke || 'Nothing broke today'}\n\n`, false, false);
    
    addText(`Tomorrow's Target:\n`, true, false);
    addText(`${entry.tomorrowTarget || 'Keep building'}\n\n`, false, false);
    
    if (entry.gratitude) {
      addText(`Gratitude:\n`, true, false);
      addText(`${entry.gratitude}\n\n`, false, false);
    }
    
    addText(`───────────────────────────────────\n\n`, false, false);
  }

  addText(`\n\nNEVER ZERO.\n`, true, true);
  addText(`Keep the signal alive.\n`, false, false);

  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests
      }
    });
  }

  return {
    documentId,
    documentUrl: `https://docs.google.com/document/d/${documentId}/edit`
  };
}
