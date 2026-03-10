import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Clock,
  Instagram,
  Trash2,
  Edit,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { brandAPI, mediaAPI } from "@/services/api";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ContentSchedulerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create post dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newPost, setNewPost] = useState({
    content_type: "image",
    caption: "",
    media_id: "",
    scheduled_time: "18:30",
    platform: "instagram"
  });
  
  // View/Edit post dialog
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("frameflow_token");
      
      let brandsData = [];
      let mediaData = [];
      let postsData = [];
      
      try {
        const brandsRes = await brandAPI.getAll();
        brandsData = brandsRes.data || [];
      } catch (e) {
        console.log("Brands fetch failed, using empty state");
      }
      
      try {
        const mediaRes = await mediaAPI.getAll();
        mediaData = mediaRes.data || [];
      } catch (e) {
        console.log("Media fetch failed, using empty state");
      }
      
      try {
        const postsRes = await fetch(`${API_URL}/api/scheduled-posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (postsRes.ok) {
          postsData = await postsRes.json();
        }
      } catch (e) {
        console.log("Scheduled posts fetch failed, using empty state");
      }
      
      setBrands(brandsData);
      setMedia(mediaData);
      setScheduledPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error) {
      console.error("Failed to load data:", error);
      // Use empty states instead of error
      setBrands([]);
      setMedia([]);
      setScheduledPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getPostsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduled_at).toISOString().split('T')[0];
      return postDate === dateStr;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setNewPost({
      ...newPost,
      scheduled_time: "18:30"
    });
    setShowCreateDialog(true);
  };

  const handleCreatePost = async () => {
    if (!newPost.caption.trim()) {
      toast.error("Please enter a caption");
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem("frameflow_token");
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = newPost.scheduled_time.split(':');
      scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const response = await fetch(`${API_URL}/api/scheduled-posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content_type: newPost.content_type,
          caption: newPost.caption,
          media_id: newPost.media_id || null,
          scheduled_at: scheduledAt.toISOString(),
          platform: newPost.platform,
          brand_id: brands[0]?.id
        })
      });

      if (!response.ok) throw new Error("Failed to schedule post");
      
      toast.success("Post scheduled successfully!");
      setShowCreateDialog(false);
      setNewPost({ content_type: "image", caption: "", media_id: "", scheduled_time: "18:30", platform: "instagram" });
      loadData();
    } catch (error) {
      console.error("Failed to schedule post:", error);
      toast.error("Failed to schedule post");
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Delete this scheduled post?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/scheduled-posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Post deleted");
      setShowViewDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const generateAICaption = async () => {
    if (!brands[0]) return;
    
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/generate/caption`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: `Generate an engaging Instagram ${newPost.content_type} caption for a café`,
          brand_id: brands[0].id,
          platform: "instagram",
          tone: "engaging",
          type: newPost.content_type
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewPost({ ...newPost, caption: data.caption });
        toast.success("Caption generated!");
      }
    } catch (error) {
      toast.error("Failed to generate caption");
    } finally {
      setCreating(false);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", 
                     "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = getDaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading content scheduler..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold font-outfit text-slate-900 mb-2">Content Scheduler</h1>
            <p className="text-lg text-slate-600">Plan and schedule your café's social media content</p>
          </div>
          <Button
            data-testid="quick-schedule-btn"
            onClick={() => { setSelectedDate(new Date()); setShowCreateDialog(true); }}
            className="rounded-full px-6 py-3 bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Schedule Post
          </Button>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-semibold font-outfit text-slate-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleNextMonth} className="rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="rounded-lg"
            >
              Today
            </Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {dayNames.map((day) => (
              <div key={day} className="p-4 text-center text-sm font-semibold text-slate-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              const posts = getPostsForDate(date);
              const isToday = date && date.toDateString() === today.toDateString();
              const isPast = date && date < today;
              
              return (
                <div
                  key={index}
                  onClick={() => !isPast && handleDateClick(date)}
                  className={`min-h-[120px] p-2 border-b border-r border-slate-100 transition-colors ${
                    date
                      ? isPast
                        ? "bg-slate-50 cursor-not-allowed"
                        : "hover:bg-indigo-50 cursor-pointer"
                      : "bg-slate-50"
                  }`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-medium mb-2 ${
                        isToday
                          ? "w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center"
                          : isPast
                          ? "text-slate-400"
                          : "text-slate-700"
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {posts.slice(0, 3).map((post) => (
                          <div
                            key={post.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPost(post);
                              setShowViewDialog(true);
                            }}
                            className={`text-xs p-1.5 rounded-lg truncate cursor-pointer transition-colors ${
                              post.content_type === "image"
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : post.content_type === "video"
                                ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {post.content_type === "image" && <ImageIcon className="w-3 h-3" />}
                              {post.content_type === "video" && <Video className="w-3 h-3" />}
                              {post.content_type === "reel" && <Video className="w-3 h-3" />}
                              <span className="truncate">{post.caption?.slice(0, 20)}...</span>
                            </div>
                          </div>
                        ))}
                        {posts.length > 3 && (
                          <div className="text-xs text-slate-500 pl-1">+{posts.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Times */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
          <h3 className="text-lg font-semibold font-outfit text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Recommended Posting Times
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { time: "7:00 AM", label: "Morning Coffee Rush", engagement: "High" },
              { time: "12:00 PM", label: "Lunch Break", engagement: "Medium" },
              { time: "3:00 PM", label: "Afternoon Pick-up", engagement: "Medium" },
              { time: "6:30 PM", label: "Evening Wind-down", engagement: "Very High" }
            ].map((slot, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-2xl font-bold text-indigo-600">{slot.time}</div>
                <div className="text-sm text-slate-600">{slot.label}</div>
                <div className={`text-xs mt-1 ${slot.engagement === "Very High" ? "text-green-600" : slot.engagement === "High" ? "text-blue-600" : "text-slate-500"}`}>
                  {slot.engagement} engagement
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-outfit text-2xl">
              Schedule Post for {selectedDate?.toLocaleDateString()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Content Type</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { value: "image", icon: ImageIcon, label: "Image" },
                  { value: "video", icon: Video, label: "Video" },
                  { value: "reel", icon: Video, label: "Reel" }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setNewPost({ ...newPost, content_type: type.value })}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      newPost.content_type === type.value
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <type.icon className={`w-5 h-5 ${newPost.content_type === type.value ? "text-indigo-600" : "text-slate-400"}`} />
                    <span className={`text-sm ${newPost.content_type === type.value ? "text-indigo-600 font-medium" : "text-slate-600"}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Caption</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateAICaption}
                  disabled={creating}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  AI Generate
                </Button>
              </div>
              <Textarea
                value={newPost.caption}
                onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                placeholder="Write your caption..."
                className="min-h-[120px]"
              />
            </div>

            <div>
              <Label>Scheduled Time</Label>
              <Input
                type="time"
                value={newPost.scheduled_time}
                onChange={(e) => setNewPost({ ...newPost, scheduled_time: e.target.value })}
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                Recommended: 6:30 PM for highest engagement
              </p>
            </div>

            <div>
              <Label>Platform</Label>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setNewPost({ ...newPost, platform: "instagram" })}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    newPost.platform === "instagram"
                      ? "border-pink-500 bg-pink-50"
                      : "border-slate-200"
                  }`}
                >
                  <Instagram className={`w-5 h-5 ${newPost.platform === "instagram" ? "text-pink-500" : "text-slate-400"}`} />
                  <span className={newPost.platform === "instagram" ? "text-pink-600 font-medium" : "text-slate-600"}>
                    Instagram
                  </span>
                </button>
              </div>
            </div>

            <Button
              data-testid="create-scheduled-post-btn"
              onClick={handleCreatePost}
              disabled={creating}
              className="w-full rounded-full py-6 bg-indigo-600"
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Schedule Post
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Post Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-outfit text-2xl">Scheduled Post</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedPost.content_type === "image" ? "bg-blue-100" :
                  selectedPost.content_type === "video" ? "bg-purple-100" : "bg-green-100"
                }`}>
                  {selectedPost.content_type === "image" && <ImageIcon className="w-5 h-5 text-blue-600" />}
                  {selectedPost.content_type === "video" && <Video className="w-5 h-5 text-purple-600" />}
                  {selectedPost.content_type === "reel" && <Video className="w-5 h-5 text-green-600" />}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 capitalize">{selectedPost.content_type} Post</div>
                  <div className="text-sm text-slate-500 flex items-center gap-1">
                    <Instagram className="w-4 h-4" />
                    {selectedPost.platform}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50">
                <Label className="text-xs text-slate-500">Caption</Label>
                <p className="text-slate-700 mt-1 whitespace-pre-wrap">{selectedPost.caption}</p>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Scheduled for {new Date(selectedPost.scheduled_at).toLocaleString()}</span>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleDeletePost(selectedPost.id)}
                  variant="outline"
                  className="flex-1 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={() => setShowViewDialog(false)}
                  className="flex-1 rounded-full bg-indigo-600"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
