const fs = require('fs');

let content = fs.readFileSync('src/components/SetupScreen.tsx', 'utf8');

// Add import
content = content.replace("import { filterWords } from '@/lib/words';", "import { filterWords } from '@/lib/words';\nimport { parseFile, extractSentences, type ParsedDocument } from '@/lib/fileParser';");

// Update GameConfig
content = content.replace("export interface GameConfig {", "export interface GameConfig {\n  customSentences?: string[];");

// Add state
const stateInjection = `
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  const [fileError, setFileError] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setFileError('');
    try {
      const doc = await parseFile(file);
      setParsedDoc(doc);
      setStartPage(1);
      setEndPage(doc.pages.length);
    } catch (err: any) {
      setFileError(err.message || 'Error reading file');
      setParsedDoc(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartFile = () => {
    if (!parsedDoc) {
      setFileError('Please upload a file first.');
      return;
    }
    const sentences = extractSentences(parsedDoc.pages, startPage, endPage, parsedDoc.isTextFile);
    if (sentences.length === 0) {
      setFileError('No sentences found in the selected range.');
      return;
    }
    onStart({ rows, duration, minLen, maxLen, customSentences: sentences });
  };
`;

content = content.replace("  const isPresetValue = PRESET_DURATIONS.some((d) => d.value === duration);", stateInjection + "\n  const isPresetValue = PRESET_DURATIONS.some((d) => d.value === duration);");

// Add File UI
const fileUI = `
        {/* File Mode Toggle */}
        <button 
          onClick={() => setActiveMode(activeMode === 'file' ? null : 'file')}
          className={\`w-full p-6 border transition-all text-left group mt-4 \${
            activeMode === 'file' 
              ? 'bg-amber-400/5 border-amber-400/50' 
              : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800'
          }\`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
              <span className={\`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors \${
                activeMode === 'file' ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300 group-hover:bg-amber-400/20 group-hover:text-amber-400'
              }\`}>
                F
              </span>
              Sentences from file
            </h2>
            <span className={\`text-sm font-medium transition-colors \${
              activeMode === 'file' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
            }\`}>
              {activeMode === 'file' ? 'Close settings' : 'Configure & Start'}
            </span>
          </div>
        </button>

        {activeMode === 'file' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300 mt-8">
            <section className="bg-slate-800/40 p-6 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-bold text-sm flex items-center justify-center">1</span>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                   Upload Document
                </h2>
              </div>
              <input
                type="file"
                accept=".txt,.pdf,.docx,.pptx"
                onChange={handleFileUpload}
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-400 file:text-slate-900 hover:file:bg-amber-300 transition-colors"
              />
              {isParsing && <p className="text-amber-400 mt-3 text-sm">Parsing file...</p>}
              {parsedDoc && !isParsing && (
                <p className="text-emerald-400 mt-3 text-sm">✓ File parsed successfully ({parsedDoc.pages.length} pages found)</p>
              )}
            </section>

            <section className={\`bg-slate-800/40 p-6 border border-slate-700/50 transition-opacity \${parsedDoc?.isTextFile ? 'opacity-50 pointer-events-none' : ''}\`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-bold text-sm flex items-center justify-center">2</span>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                   Select Page Range
                </h2>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                {parsedDoc?.isTextFile ? "Page selection is disabled for TXT files. The entire file will be used." : "Choose which pages to extract sentences from."}
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Starting Page</label>
                  <input
                    type="number"
                    min={1}
                    max={parsedDoc ? parsedDoc.pages.length : 1}
                    value={startPage}
                    onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                    disabled={!parsedDoc || parsedDoc.isTextFile}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 focus:border-amber-400 focus:outline-none text-lg font-semibold text-center text-slate-100 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Ending Page</label>
                  <input
                    type="number"
                    min={startPage}
                    max={parsedDoc ? parsedDoc.pages.length : 1}
                    value={endPage}
                    onChange={(e) => setEndPage(parseInt(e.target.value) || 1)}
                    disabled={!parsedDoc || parsedDoc.isTextFile}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 focus:border-amber-400 focus:outline-none text-lg font-semibold text-center text-slate-100 disabled:opacity-50"
                  />
                </div>
              </div>
            </section>

            {fileError && (
              <div className="text-center text-rose-400 text-sm font-medium">{fileError}</div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleStartFile}
                disabled={!parsedDoc || isParsing}
                className={\`flex items-center gap-3 px-10 py-4 font-bold text-lg transition-all \${
                  parsedDoc && !isParsing
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:scale-105'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }\`}
              >
                Start Typing
              </button>
            </div>
          </div>
        )}
`;

content = content.replace("      </div>\n    </div>\n  );\n}", fileUI + "\n      </div>\n    </div>\n  );\n}");

fs.writeFileSync('src/components/SetupScreen.tsx', content);
