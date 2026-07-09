import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Trash2,
  Wand2,
  Palette,
  Maximize2,
  RotateCcw,
  Settings,
  BookOpen,
  Users,
  MapPin,
  Layers,
  Frame,
  Camera,
  PenTool,
  Grid3X3,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Circle,
  Star,
  Zap,
  Info,
} from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  createdAt: Date;
}

interface ImageStyle {
  id: string;
  name: string;
  description: string;
  promptSuffix: string;
}

const IMAGE_STYLES: ImageStyle[] = [
  { id: 'realistic', name: 'Realistic', description: 'Photorealistic imagery', promptSuffix: 'photorealistic, highly detailed, 8k, professional photography' },
  { id: 'illustration', name: 'Illustration', description: 'Digital art style', promptSuffix: 'digital illustration, vibrant colors, professional artwork' },
  { id: 'watercolor', name: 'Watercolor', description: 'Soft watercolor painting', promptSuffix: 'watercolor painting, soft edges, artistic, delicate brushstrokes' },
  { id: 'sketch', name: 'Sketch', description: 'Pencil drawing style', promptSuffix: 'pencil sketch, detailed linework, artistic, hand-drawn' },
  { id: 'oil_painting', name: 'Oil Painting', description: 'Classic oil painting', promptSuffix: 'oil painting, rich colors, textured brushstrokes, classical art' },
  { id: 'anime', name: 'Anime/Manga', description: 'Japanese art style', promptSuffix: 'anime style, manga art, detailed, vibrant' },
  { id: 'vintage', name: 'Vintage', description: 'Retro aesthetic', promptSuffix: 'vintage style, retro, nostalgic, aged look' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simple clean design', promptSuffix: 'minimalist design, clean lines, simple, modern' },
  { id: 'fantasy', name: 'Fantasy Art', description: 'Epic fantasy style', promptSuffix: 'fantasy art, epic, magical, detailed worldbuilding' },
  { id: 'children', name: 'Children Book', description: 'Friendly illustrated', promptSuffix: 'children book illustration, friendly, colorful, whimsical' },
];

const ASPECT_RATIOS = [
  { id: 'square', name: 'Square (1:1)', width: 1024, height: 1024, icon: Square },
  { id: 'landscape', name: 'Landscape (16:9)', width: 1024, height: 576, icon: RectangleHorizontal },
  { id: 'portrait', name: 'Portrait (9:16)', width: 576, height: 1024, icon: RectangleVertical },
  { id: 'book_cover', name: 'Book Cover (2:3)', width: 683, height: 1024, icon: BookOpen },
  { id: 'chapter_header', name: 'Chapter Header (3:1)', width: 1024, height: 341, icon: Frame },
];

const QUICK_PROMPTS = [
  { category: 'Characters', prompts: ['A wise elderly mentor character', 'A young hero with determination', 'A mysterious villain in shadows'] },
  { category: 'Scenes', prompts: ['A cozy cottage in an enchanted forest', 'A bustling medieval marketplace', 'An ancient library filled with books'] },
  { category: 'Objects', prompts: ['An ornate magical amulet', 'A weathered leather journal', 'A mystical crystal orb'] },
  { category: 'Covers', prompts: ['Epic fantasy book cover with castle', 'Romance novel cover with sunset', 'Thriller cover with dark cityscape'] },
];

interface ImageCreationProps {
  onInsert: (imageUrl: string, altText: string) => void;
  bookTitle?: string;
  genre?: string;
}

export default function ImageCreation({ onInsert, bookTitle, genre }: ImageCreationProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('generate');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('illustration');
  const [aspectRatio, setAspectRatio] = useState('square');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your image",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const style = IMAGE_STYLES.find(s => s.id === selectedStyle);
      const ratio = ASPECT_RATIOS.find(r => r.id === aspectRatio);
      
      const fullPrompt = `${prompt}${style ? `, ${style.promptSuffix}` : ''}`;
      
      const response = await fetch('/api/book-studio/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          negativePrompt: negativePrompt || 'blurry, low quality, distorted, ugly, bad anatomy',
          width: ratio?.width || 1024,
          height: ratio?.height || 1024,
          style: selectedStyle,
        }),
      });
      
      const data = await response.json();

      if (data.imageUrl) {
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: data.imageUrl,
          prompt: prompt,
          style: selectedStyle,
          createdAt: new Date(),
        };
        
        setGeneratedImages([newImage, ...generatedImages]);
        setSelectedImage(newImage);
        
        toast({
          title: "Image generated!",
          description: "Your image is ready to insert",
        });
      }
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Could not generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertImage = () => {
    if (selectedImage) {
      onInsert(selectedImage.url, selectedImage.prompt);
      toast({
        title: "Image inserted",
        description: "Image added to your document",
      });
    }
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: bookTitle || '' }),
      });
      
      const data = await response.json();
      
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        toast({
          title: "Prompt enhanced",
          description: "AI has improved your image description",
        });
      }
    } catch (error) {
      const enhanced = `${prompt}, professional quality, highly detailed, masterpiece`;
      setPrompt(enhanced);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          AI Image Creation
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Generate illustrations, covers, and scenes for your book
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-3">
          <TabsTrigger value="generate" className="text-xs">Generate</TabsTrigger>
          <TabsTrigger value="gallery" className="text-xs">Gallery</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="generate" className="p-4 space-y-4">
            <div>
              <Label>Image Description</Label>
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create... e.g., 'A mysterious castle on a cliff at sunset, with dragons flying overhead'"
                  rows={4}
                  className="pr-10"
                  data-testid="input-image-prompt"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={enhancePrompt}
                  disabled={isGenerating || !prompt.trim()}
                  title="Enhance with AI"
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Style</Label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger data-testid="select-image-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      <div className="flex flex-col">
                        <span>{style.name}</span>
                        <span className="text-xs text-muted-foreground">{style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Aspect Ratio</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <Button
                    key={ratio.id}
                    variant={aspectRatio === ratio.id ? "default" : "outline"}
                    size="sm"
                    className="flex flex-col h-auto py-2 gap-1"
                    onClick={() => setAspectRatio(ratio.id)}
                  >
                    <ratio.icon className="w-4 h-4" />
                    <span className="text-[10px]">{ratio.name.split(' ')[0]}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <span>Negative Prompt</span>
                <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to avoid... e.g., 'blurry, distorted'"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={generateImage}
              disabled={isGenerating || !prompt.trim()}
              data-testid="button-generate-image"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>

            <Separator />

            {selectedImage && (
              <div className="space-y-4">
                <Label>Preview</Label>
                <Card>
                  <CardContent className="p-2">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.prompt}
                      className="w-full rounded-md"
                    />
                  </CardContent>
                </Card>
                
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleInsertImage}>
                    <Download className="w-4 h-4 mr-2" />
                    Insert Image
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => generateImage()}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {!selectedImage && generatedImages.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Your generated images will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="p-4 space-y-4">
            {generatedImages.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Grid3X3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No images generated yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {generatedImages.map((image) => (
                  <Card
                    key={image.id}
                    className={`cursor-pointer hover-elevate ${selectedImage?.id === image.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <CardContent className="p-2">
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full aspect-square object-cover rounded-md"
                      />
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        {image.prompt}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="p-4 space-y-4">
            {QUICK_PROMPTS.map((category) => (
              <div key={category.category}>
                <Label className="mb-2 block">{category.category}</Label>
                <div className="space-y-2">
                  {category.prompts.map((promptText, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => {
                        setPrompt(promptText);
                        setActiveTab('generate');
                      }}
                    >
                      <Zap className="w-4 h-4 mr-2 shrink-0 text-primary" />
                      <span className="text-sm">{promptText}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            <Separator />

            <div>
              <Label className="mb-2 block">Book-Specific Templates</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2"
                  onClick={() => {
                    setPrompt(`Book cover for "${bookTitle || 'My Novel'}", professional publishing quality`);
                    setAspectRatio('book_cover');
                    setActiveTab('generate');
                  }}
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="text-xs">Book Cover</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2"
                  onClick={() => {
                    setPrompt('Decorative chapter header illustration with ornate borders');
                    setAspectRatio('chapter_header');
                    setActiveTab('generate');
                  }}
                >
                  <Frame className="w-5 h-5" />
                  <span className="text-xs">Chapter Header</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2"
                  onClick={() => {
                    setPrompt('Character portrait, detailed face, expressive eyes');
                    setAspectRatio('portrait');
                    setActiveTab('generate');
                  }}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs">Character</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2"
                  onClick={() => {
                    setPrompt('Fantasy world map with terrain details and location markers');
                    setAspectRatio('landscape');
                    setActiveTab('generate');
                  }}
                >
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs">World Map</span>
                </Button>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
