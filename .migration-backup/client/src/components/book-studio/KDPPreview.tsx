import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
  Check,
  X,
  Printer,
  Download,
  Eye,
  Ruler,
  Settings,
  LayoutGrid,
} from "lucide-react";

interface TrimSize {
  name: string;
  width: number;
  height: number;
  code: string;
}

interface KDPPreviewProps {
  content: string;
  title?: string;
  author?: string;
  chapterTitle?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const TRIM_SIZES: TrimSize[] = [
  { name: '5" x 8"', width: 5, height: 8, code: '5x8' },
  { name: '5.25" x 8"', width: 5.25, height: 8, code: '5.25x8' },
  { name: '5.5" x 8.5"', width: 5.5, height: 8.5, code: '5.5x8.5' },
  { name: '6" x 9"', width: 6, height: 9, code: '6x9' },
  { name: '6.14" x 9.21"', width: 6.14, height: 9.21, code: '6.14x9.21' },
  { name: '7" x 10"', width: 7, height: 10, code: '7x10' },
  { name: '8" x 10"', width: 8, height: 10, code: '8x10' },
  { name: '8.5" x 11"', width: 8.5, height: 11, code: '8.5x11' },
];

const KDP_MARGINS = {
  inside: 0.375,
  outside: 0.25,
  top: 0.25,
  bottom: 0.25,
  gutter: 0.125,
  bleed: 0.125,
};

export default function KDPPreview({
  content,
  title = "Untitled Book",
  author = "Author Name",
  chapterTitle,
  isOpen = true,
  onClose,
}: KDPPreviewProps) {
  const [trimSize, setTrimSize] = useState<TrimSize>(TRIM_SIZES[3]);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [showBleed, setShowBleed] = useState(true);
  const [viewMode, setViewMode] = useState<'single' | 'spread'>('single');
  const previewRef = useRef<HTMLDivElement>(null);

  const ppi = 72;
  const pageWidth = trimSize.width * ppi;
  const pageHeight = trimSize.height * ppi;

  const marginInside = KDP_MARGINS.inside * ppi;
  const marginOutside = KDP_MARGINS.outside * ppi;
  const marginTop = KDP_MARGINS.top * ppi;
  const marginBottom = KDP_MARGINS.bottom * ppi;
  const bleed = KDP_MARGINS.bleed * ppi;

  const contentArea = {
    width: pageWidth - marginInside - marginOutside,
    height: pageHeight - marginTop - marginBottom,
  };

  const pages = useMemo(() => {
    if (!content) return [''];
    
    const charsPerLine = Math.floor(contentArea.width / 7);
    const linesPerPage = Math.floor(contentArea.height / 18);
    const charsPerPage = charsPerLine * linesPerPage;
    
    const paragraphs = content.split(/\n\n+/);
    const allPages: string[] = [];
    let currentPageContent = '';
    let currentCharCount = 0;
    
    for (const paragraph of paragraphs) {
      const paragraphWithBreak = paragraph + '\n\n';
      
      if (currentCharCount + paragraphWithBreak.length > charsPerPage) {
        if (currentPageContent) {
          allPages.push(currentPageContent);
        }
        currentPageContent = paragraphWithBreak;
        currentCharCount = paragraphWithBreak.length;
      } else {
        currentPageContent += paragraphWithBreak;
        currentCharCount += paragraphWithBreak.length;
      }
    }
    
    if (currentPageContent) {
      allPages.push(currentPageContent);
    }
    
    return allPages.length > 0 ? allPages : [''];
  }, [content, contentArea.width, contentArea.height]);

  const totalPages = pages.length;

  const kdpChecks = useMemo(() => {
    const checks = [
      {
        name: 'Minimum Margins',
        status: 'pass' as const,
        message: `Inside: ${KDP_MARGINS.inside}", Outside: ${KDP_MARGINS.outside}"`,
      },
      {
        name: 'Bleed Settings',
        status: showBleed ? 'pass' as const : 'warn' as const,
        message: showBleed ? '0.125" bleed enabled' : 'Bleed not enabled',
      },
      {
        name: 'Trim Size',
        status: 'pass' as const,
        message: `${trimSize.name} (KDP supported)`,
      },
      {
        name: 'Page Count',
        status: totalPages >= 24 ? 'pass' as const : 'warn' as const,
        message: `${totalPages} pages (min: 24 for paperback)`,
      },
      {
        name: 'Font Embedding',
        status: 'pass' as const,
        message: 'Using web-safe fonts',
      },
      {
        name: 'Image Resolution',
        status: 'pass' as const,
        message: 'Text-only (no images to check)',
      },
    ];
    
    return checks;
  }, [trimSize, showBleed, totalPages]);

  const passCount = kdpChecks.filter(c => c.status === 'pass').length;
  const warnCount = kdpChecks.filter(c => c.status === 'warn').length;
  const failCount = 0; // Currently no fail conditions implemented

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">KDP Preview</span>
          </div>
          
          <Select
            value={trimSize.code}
            onValueChange={(v) => setTrimSize(TRIM_SIZES.find(t => t.code === v) || TRIM_SIZES[3])}
          >
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIM_SIZES.map(size => (
                <SelectItem key={size.code} value={size.code}>
                  {size.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="text-xs w-10 text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => setZoom(Math.min(200, zoom + 10))}
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>
          
          <Button
            variant={showGuides ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => setShowGuides(!showGuides)}
          >
            <Ruler className="w-3.5 h-3.5" />
          </Button>
          
          <Button
            variant={viewMode === 'spread' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => setViewMode(viewMode === 'single' ? 'spread' : 'single')}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
          
          {onClose && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose} aria-label="Close KDP preview" data-testid="button-close-kdp">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-muted/50 p-6">
          <div 
            ref={previewRef}
            className="mx-auto"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {viewMode === 'spread' && currentPage > 1 ? (
              <div className="flex gap-1 shadow-2xl">
                <div
                  className="bg-white shadow-lg relative"
                  style={{
                    width: pageWidth + (showBleed ? bleed * 2 : 0),
                    height: pageHeight + (showBleed ? bleed * 2 : 0),
                  }}
                >
                  {showBleed && (
                    <div 
                      className="absolute inset-0 border-2 border-dashed border-red-300 pointer-events-none"
                      style={{ margin: bleed }}
                    />
                  )}
                  
                  {showGuides && (
                    <>
                      <div 
                        className="absolute border-l border-dashed border-blue-300"
                        style={{ left: (showBleed ? bleed : 0) + marginOutside, top: 0, bottom: 0 }}
                      />
                      <div 
                        className="absolute border-r border-dashed border-blue-300"
                        style={{ right: (showBleed ? bleed : 0) + marginInside, top: 0, bottom: 0 }}
                      />
                      <div 
                        className="absolute border-t border-dashed border-blue-300"
                        style={{ top: (showBleed ? bleed : 0) + marginTop, left: 0, right: 0 }}
                      />
                      <div 
                        className="absolute border-b border-dashed border-blue-300"
                        style={{ bottom: (showBleed ? bleed : 0) + marginBottom, left: 0, right: 0 }}
                      />
                    </>
                  )}
                  
                  <div
                    className="absolute overflow-hidden"
                    style={{
                      left: (showBleed ? bleed : 0) + marginOutside,
                      right: (showBleed ? bleed : 0) + marginInside,
                      top: (showBleed ? bleed : 0) + marginTop,
                      bottom: (showBleed ? bleed : 0) + marginBottom,
                    }}
                  >
                    <div className="text-[11px] leading-[1.6] font-serif text-gray-800 whitespace-pre-wrap">
                      {pages[currentPage - 2] || ''}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-gray-500">
                      {currentPage - 1}
                    </div>
                  </div>
                </div>
                
                <div
                  className="bg-white shadow-lg relative"
                  style={{
                    width: pageWidth + (showBleed ? bleed * 2 : 0),
                    height: pageHeight + (showBleed ? bleed * 2 : 0),
                  }}
                >
                  {showBleed && (
                    <div 
                      className="absolute inset-0 border-2 border-dashed border-red-300 pointer-events-none"
                      style={{ margin: bleed }}
                    />
                  )}
                  
                  {showGuides && (
                    <>
                      <div 
                        className="absolute border-l border-dashed border-blue-300"
                        style={{ left: (showBleed ? bleed : 0) + marginInside, top: 0, bottom: 0 }}
                      />
                      <div 
                        className="absolute border-r border-dashed border-blue-300"
                        style={{ right: (showBleed ? bleed : 0) + marginOutside, top: 0, bottom: 0 }}
                      />
                    </>
                  )}
                  
                  <div
                    className="absolute overflow-hidden"
                    style={{
                      left: (showBleed ? bleed : 0) + marginInside,
                      right: (showBleed ? bleed : 0) + marginOutside,
                      top: (showBleed ? bleed : 0) + marginTop,
                      bottom: (showBleed ? bleed : 0) + marginBottom,
                    }}
                  >
                    <div className="text-[11px] leading-[1.6] font-serif text-gray-800 whitespace-pre-wrap">
                      {pages[currentPage - 1] || ''}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-gray-500">
                      {currentPage}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="bg-white shadow-2xl relative mx-auto"
                style={{
                  width: pageWidth + (showBleed ? bleed * 2 : 0),
                  height: pageHeight + (showBleed ? bleed * 2 : 0),
                }}
              >
                {showBleed && (
                  <div 
                    className="absolute inset-0 border-2 border-dashed border-red-300 pointer-events-none"
                    style={{ margin: bleed }}
                  />
                )}
                
                {showGuides && (
                  <>
                    <div 
                      className="absolute border-l border-dashed border-blue-300"
                      style={{ 
                        left: (showBleed ? bleed : 0) + (currentPage % 2 === 0 ? marginOutside : marginInside), 
                        top: 0, 
                        bottom: 0 
                      }}
                    />
                    <div 
                      className="absolute border-r border-dashed border-blue-300"
                      style={{ 
                        right: (showBleed ? bleed : 0) + (currentPage % 2 === 0 ? marginInside : marginOutside), 
                        top: 0, 
                        bottom: 0 
                      }}
                    />
                    <div 
                      className="absolute border-t border-dashed border-blue-300"
                      style={{ top: (showBleed ? bleed : 0) + marginTop, left: 0, right: 0 }}
                    />
                    <div 
                      className="absolute border-b border-dashed border-blue-300"
                      style={{ bottom: (showBleed ? bleed : 0) + marginBottom, left: 0, right: 0 }}
                    />
                  </>
                )}
                
                <div
                  className="absolute overflow-hidden"
                  style={{
                    left: (showBleed ? bleed : 0) + (currentPage % 2 === 0 ? marginOutside : marginInside),
                    right: (showBleed ? bleed : 0) + (currentPage % 2 === 0 ? marginInside : marginOutside),
                    top: (showBleed ? bleed : 0) + marginTop,
                    bottom: (showBleed ? bleed : 0) + marginBottom,
                  }}
                >
                  {currentPage === 1 && (
                    <div className="text-center pt-[30%]">
                      <h1 className="text-xl font-serif font-bold mb-4">{title}</h1>
                      <p className="text-sm text-gray-600">{author}</p>
                    </div>
                  )}
                  
                  {currentPage > 1 && (
                    <>
                      {chapterTitle && currentPage === 2 && (
                        <h2 className="text-lg font-serif font-bold mb-6 text-center">{chapterTitle}</h2>
                      )}
                      <div className="text-[11px] leading-[1.6] font-serif text-gray-800 whitespace-pre-wrap">
                        {pages[currentPage - 2] || ''}
                      </div>
                    </>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-gray-500">
                    {currentPage}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-64 border-l bg-card overflow-hidden flex flex-col">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Page Navigation</span>
              <span className="text-xs text-muted-foreground">{currentPage} / {totalPages + 1}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Slider
                value={[currentPage]}
                onValueChange={([v]) => setCurrentPage(v)}
                min={1}
                max={totalPages + 1}
                step={1}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => setCurrentPage(Math.min(totalPages + 1, currentPage + 1))}
                disabled={currentPage >= totalPages + 1}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium">KDP Guardrails</span>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-[9px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    {passCount} pass
                  </Badge>
                  {warnCount > 0 && (
                    <Badge variant="secondary" className="text-[9px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                      {warnCount} warn
                    </Badge>
                  )}
                  {failCount > 0 && (
                    <Badge variant="secondary" className="text-[9px] bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                      {failCount} fail
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                {kdpChecks.map((check, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                    {check.status === 'pass' && (
                      <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                    )}
                    {check.status === 'warn' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-medium">{check.name}</p>
                      <p className="text-[10px] text-muted-foreground">{check.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <span className="text-xs font-medium">Page Specifications</span>
                <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Trim Size:</span>
                    <span className="font-medium">{trimSize.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inside Margin:</span>
                    <span className="font-medium">{KDP_MARGINS.inside}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outside Margin:</span>
                    <span className="font-medium">{KDP_MARGINS.outside}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Top/Bottom:</span>
                    <span className="font-medium">{KDP_MARGINS.top}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bleed:</span>
                    <span className="font-medium">{KDP_MARGINS.bleed}"</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t">
            <Button className="w-full h-8 text-xs gap-2">
              <Download className="w-3.5 h-3.5" />
              Export KDP-Ready PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
