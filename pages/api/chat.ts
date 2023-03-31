import type { NextApiRequest, NextApiResponse } from 'next';

import { VectorDBQAChain } from 'langchain/chains';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { openai } from '@/utils/openai-client';
import { PineconeStore } from 'langchain/vectorstores';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }

  try {
    // OpenAI recommends replacing newlines with spaces for best results
    const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

    const index = pinecone.Index(PINECONE_INDEX_NAME);
    /* create vectorstore*/
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({
        modelName: 'text-embedding-ada-002',
      }),
      {
        pineconeIndex: index,
        textKey: 'text',
        namespace: PINECONE_NAME_SPACE,
      },
    );

    // create the chain
    const model = openai;
    const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
      k: 3,
      returnSourceDocuments: true,
    });

    //Ask a question
    console.time('chain.call');
    const response = await chain.call({
      query: sanitizedQuestion,
    });
    console.timeEnd('chain.call');
    // console.log('response', response);

    res.status(200).json(response);
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error?.message || 'Unknown error.' });
  }
}
