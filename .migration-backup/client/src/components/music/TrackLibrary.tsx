import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Library,
  Search,
  Upload,
  Sparkles,
  Music,
  Play,
  Pause,
  Plus,
  Clock,
  Disc,
  Loader2,
  ExternalLink,
  Heart,
  MoreHorizontal
} from "lucide-react";
import { SiSpotify, SiYoutube } from "react-icons/si";

interface Track {
  id: string;
  name: string;
  artist: string;
  album?: string;
  duration: number;
  previewUrl?: string;
  imageUrl?: string;
  source: "spotify" | "upload" | "ai" | "youtube";
  bpm?: number;
  key?: string;
}

interface TrackLibraryProps {
  onTrackSelect?: (track: Track, deck: "A" | "B") => void;
}

export function TrackLibrary({ onTrackSelect }: TrackLibraryProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("library");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: spotifyTracks = [], isLoading: spotifyLoading } = useQuery<Track[]>({
    queryKey: ["/api/spotify/search", searchQuery],
    enabled: searchQuery.length > 2 && activeTab === "spotify",
  });

  const { data: libraryTracks = [], isLoading: libraryLoading } = useQuery<Track[]>({
    queryKey: ["/api/music/library"],
  });

  const { data: aiTracks = [], isLoading: aiLoading } = useQuery<Track[]>({
    queryKey: ["/api/music/ai-generated"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("audio", file);
      const res = await fetch("/api/music/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Track Uploaded", description: "Your track is now in your library" });
    },
    onError: () => {
      toast({ title: "Upload Failed", description: "Could not upload track", variant: "destructive" });
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const togglePlayPreview = (track: Track) => {
    if (!track.previewUrl) return;

    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.previewUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingTrackId(null);
      setPlayingTrackId(track.id);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSourceIcon = (source: Track["source"]) => {
    switch (source) {
      case "spotify": return <SiSpotify className="w-4 h-4 text-green-500" />;
      case "youtube": return <SiYoutube className="w-4 h-4 text-red-500" />;
      case "ai": return <Sparkles className="w-4 h-4 text-orange-500" />;
      default: return <Music className="w-4 h-4 text-gray-400" />;
    }
  };

  const TrackRow = ({ track }: { track: Track }) => (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800/50 group transition-colors">
      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
        {track.imageUrl ? (
          <img src={track.imageUrl} alt={track.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc className="w-6 h-6 text-gray-600" />
          </div>
        )}
        {track.previewUrl && (
          <button
            onClick={() => togglePlayPreview(track)}
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`button-preview-${track.id}`}
          >
            {playingTrackId === track.id ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{track.name}</p>
        <p className="text-xs text-gray-400 truncate">{track.artist}</p>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {getSourceIcon(track.source)}
        {track.bpm && (
          <Badge variant="outline" className="text-xs font-mono">{track.bpm}</Badge>
        )}
        {track.key && (
          <Badge variant="outline" className="text-xs">{track.key}</Badge>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        {formatDuration(track.duration)}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onTrackSelect?.(track, "A")}
          data-testid={`button-load-a-${track.id}`}
        >
          <Badge className="text-xs bg-amber-600">A</Badge>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onTrackSelect?.(track, "B")}
          data-testid={`button-load-b-${track.id}`}
        >
          <Badge className="text-xs bg-emerald-600">B</Badge>
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Library className="w-5 h-5 text-orange-500" />
          Track Library
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracks..."
              className="pl-9 bg-gray-800 border-gray-700"
              data-testid="input-search-tracks"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            data-testid="button-upload"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 w-full">
            <TabsTrigger value="library" className="flex-1" data-testid="tab-library">
              <Music className="w-3 h-3 mr-1" />
              Library
            </TabsTrigger>
            <TabsTrigger value="spotify" className="flex-1" data-testid="tab-spotify">
              <SiSpotify className="w-3 h-3 mr-1" />
              Spotify
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1" data-testid="tab-ai">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Generated
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-3">
            <ScrollArea className="h-[300px]">
              {libraryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : libraryTracks.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                  <p className="text-gray-400">No tracks in library</p>
                  <p className="text-xs text-gray-500 mt-1">Upload or generate tracks to get started</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {libraryTracks.map((track) => (
                    <TrackRow key={track.id} track={track} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="spotify" className="mt-3">
            <ScrollArea className="h-[300px]">
              {searchQuery.length < 3 ? (
                <div className="text-center py-8">
                  <SiSpotify className="w-12 h-12 mx-auto mb-2 text-green-500/50" />
                  <p className="text-gray-400">Search Spotify</p>
                  <p className="text-xs text-gray-500 mt-1">Type at least 3 characters to search</p>
                </div>
              ) : spotifyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                </div>
              ) : spotifyTracks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No results found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {spotifyTracks.map((track) => (
                    <TrackRow key={track.id} track={{ ...track, source: "spotify" }} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ai" className="mt-3">
            <ScrollArea className="h-[300px]">
              {aiLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : aiTracks.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 mx-auto mb-2 text-orange-500/50" />
                  <p className="text-gray-400">No AI-generated tracks yet</p>
                  <p className="text-xs text-gray-500 mt-1">Use the AI Music Studio to create tracks</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {aiTracks.map((track) => (
                    <TrackRow key={track.id} track={{ ...track, source: "ai" }} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
