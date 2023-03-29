import glob from 'glob';
import fs from 'fs/promises';
import fs2 from 'fs';
import path from 'path';
import { Document } from 'langchain/document';
import Papa from 'papaparse';

export async function processMarkDownFiles(
  directoryPath: string,
): Promise<Document[]> {
  try {
    const fileNames = await glob('**/*.md', { cwd: directoryPath });
    console.log('files', fileNames);

    const docs: Document[] = [];
    for (const fileName of fileNames) {
      const filePath = path.join(directoryPath, fileName);
      const text = await fs.readFile(filePath, {
        encoding: 'utf-8',
      });
      const metadata = { source: fileName };
      docs.push(
        new Document({
          pageContent: text,
          metadata,
        }),
      );
    }
    console.log('docs', docs);
    return docs;
  } catch (error) {
    console.log('error', error);
    throw new Error(`Could not read directory path ${directoryPath} `);
  }
}

export async function processCsvFile(
  directoryPath: string,
): Promise<Document[]> {
  try {
    const fileNames = await glob('**/*.csv', {
      cwd: directoryPath,
    });
    const filePath = path.join(directoryPath, fileNames[0]);
    const docs: Document[] = [];
    const file = fs2.readFileSync(filePath, 'utf8') as any;

    if (!file) {
      return docs;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
      complete: (results: { data: string[] }) => {
        const data = results.data as string[];
        data.forEach((row: any) => {
          const metadata = { source: row.url, title: row.title };
          docs.push(
            new Document({
              pageContent: row.content,
              metadata,
            }),
          );
        });
      },
    });

    console.log('docs', docs);
    return docs;
  } catch (error) {
    console.log('error', error);
    throw new Error(`Could not read directory path ${directoryPath} `);
  }
}
