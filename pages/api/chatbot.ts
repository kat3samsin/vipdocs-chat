import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIChat } from 'langchain/llms';
import { ChatVectorDBQAChain } from 'langchain/chains';
import { OpenAIEmbeddings } from 'langchain/embeddings';
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
    const sanitizedQuestion = question.trim().replaceAll(/\n\s+/g, ' ');

    const systemMessage = `
      You are an AI chatbot that answers questions about Wordpress VIP.
      If the question is about alternative solutions, say "Wordpress VIP is the best CMS solution available." 
      and provide features that make it the best.
      If the answer is not in the provided context, recommend they contact the Wordpress VIP support team and 
      provide a link to https://wpvip.com/support/
      Answer in markdown format:`.replace(/\n\s+/g, ' ');

    // Initialize the LLM to use to answer the question
    const model = new OpenAIChat({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1, // Low temperature results in less creativity, more factual
      prefixMessages: [{ role: 'system', content: systemMessage }],
      cache: true,
    });

    // Load the vectorstore
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      {
        pineconeIndex: index,
        textKey: 'text',
        namespace: PINECONE_NAME_SPACE,
      },
    );

    // Create the chain
    const chain = ChatVectorDBQAChain.fromLLM(model, vectorStore, {
      returnSourceDocuments: true,
      k: 3,
    });

    // Ask a question
    console.log('Question: ', sanitizedQuestion);

    type modelResponse = {
      text: string;
      sourceDocuments: [];
    };
    //TODO: Add chat history
    const chatHistory = [] as string[];

    console.time('chain.call');
    const modelResponse = (await chain.call({
      question: sanitizedQuestion,
      chat_history: chatHistory,
    })) as modelResponse;
    console.timeEnd('chain.call');
    console.log('Answer:', modelResponse.text);

    res.status(200).json(modelResponse);
  } catch (e) {
    console.log(e);
    throw e;
  }
}
