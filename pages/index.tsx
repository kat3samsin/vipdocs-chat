import { useRef, useState, useEffect } from 'react';
import Layout from '@/components/layout';
// import Answer from './answer';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
interface Source {
  url: string;
  title: string;
}

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string>('');
  const [sources, setSources] = useState(new Array<Source>());

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSearch() {
    if (!query) {
      alert('Please input a question');
      return;
    }

    setAnswer('');
    setLoading(true);

    const question = query.trim();

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
        }),
      });

      if (!response.ok) {
        setLoading(false);
        throw new Error(response.statusText);
      }

      //set answer
      const responseJson = await response.json();
      console.log('answer', responseJson);
      setAnswer(responseJson.text);

      //set sources
      const newSources = new Array<Source>();
      const sourceTitles = {} as any;
      responseJson.sourceDocuments?.forEach((doc: any) => {
        //make sure we don't have duplicate titles
        if (!sourceTitles[doc.metadata?.title]) {
          sourceTitles[doc.metadata?.title] = true;
          newSources.push({
            url: doc.metadata?.source,
            title: doc.metadata?.title,
          });
        }
      });
      console.log('sources.length', newSources.length);
      setSources(newSources);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log('error', error);
    }
  }

  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSearch();
    } else {
      return;
    }
  };

  return (
    <>
      <Layout>
        <section className="container max-w-xl mx-auto pt-4 pb-6 md:pt-8 md:pb-10 lg:pt-10 lg:pb-16">
          <div className="mx-auto flex flex-col gap-4">
            <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center mb-3">
              Ask Wordpress VIP
            </h1>
            <div className="flex w-full max-w-xl items-center space-x-2">
              <input
                ref={inputRef}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
                type="text"
                placeholder="Why is WordPress VIP awesome?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleEnter}
              />
              <button
                onClick={handleSearch}
                className="active:scale-95 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:hover:bg-slate-800 dark:hover:text-slate-100 disabled:opacity-50 dark:focus:ring-slate-400 disabled:pointer-events-none dark:focus:ring-offset-slate-900 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800 bg-slate-900 text-white hover:bg-slate-700  h-10 py-2 px-4"
              >
                Search
              </button>
            </div>
            {loading && (
              <div className="mt-3">
                <>
                  <div className="animate-pulse mt-2">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded mt-2"></div>
                    <div className="h-4 bg-gray-300 rounded mt-2"></div>
                    <div className="h-4 bg-gray-300 rounded mt-2"></div>
                    <div className="h-4 bg-gray-300 rounded mt-2"></div>
                  </div>
                </>
              </div>
            )}
            {!loading && answer && (
              <>
                <div className="rounded-md border-neutral-300 border p-5 mt-4">
                  <h2 className="text-xl font-bold leading-[1.1] tracking-tighter text-center">
                    Answer
                  </h2>
                  <div className="leading-normal text-slate-700 sm:leading-7 mt-3">
                    <Markdown className="prose" remarkPlugins={[remarkGfm]}>
                      {answer}
                    </Markdown>
                    <br />
                    <b>Sources: </b>
                    <br />
                    {sources && (
                      <ul>
                        {sources.map((source, index) => (
                          <li key={index}>
                            <a
                              href={source.url}
                              target="_blank"
                              style={{ textDecoration: 'underline' }}
                            >
                              {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </Layout>
    </>
  );
}
