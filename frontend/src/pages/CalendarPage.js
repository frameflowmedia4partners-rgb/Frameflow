import { useState, useEffect } from "react";
import ClientLayout from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  Instagram,
  Image as ImageIcon,
  Film,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const platforms = [
  { id: "instagram_feed", label: "Instagram Feed", icon: ImageIcon },
  { id: "instagram_story", label: "Instagram Story", icon: Instagram },
  { id: "instagram_reel", label: "Instagram Reel", icon: Film },
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [library, setLibrary] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // month, week
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    library_item_id: "",
    scheduled_time: "12:00",
    platform: "instagram_feed",
    caption: "",
    hashtags: "",
    status: "scheduled"
  });

  useEffect(() => {
    loadData();
  }, [currentDate]);

  useEffect(() => {
    // Check for post to schedule from other pages
    const savedPost = localStorage.getItem("schedulePost");
    const savedReel = localStorage.getItem("scheduleReel");
    
    if (savedPost || savedReel) {
      // Would need to save to library first, then schedule
      localStorage.removeItem("schedulePost");
      localStorage.removeItem("scheduleReel");
      toast.info("Select a date to schedule your content");
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load library
      const libraryRes = await api.get("/content-library");
      setLibrary(libraryRes.data || []);
      
      // Load scheduled posts for current month
      const postsRes = await api.get("/calendar/posts", {
        params: {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear()
        }
      });
      setScheduledPosts(postsRes.data?.posts || []);
      
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Previous month padding
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, date: null });
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ day: i, date: date.toISOString().split('T')[0] });
    }
    
    return days;
  };

  const getPostsForDate = (dateStr) => {
    return scheduledPosts.filter(post => post.scheduled_date === dateStr);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const openScheduleModal = (date) => {
    setSelectedDate(date);
    setFormData({
      library_item_id: "",
      scheduled_time: "12:00",
      platform: "instagram_feed",
      caption: "",
      hashtags: "",
      status: "scheduled"
    });
    setSelectedPost(null);
    setShowModal(true);
  };

  const openEditModal = (post) => {
    setSelectedDate(post.scheduled_date);
    setSelectedPost(post);
    setFormData({
      library_item_id: post.library_item_id,
      scheduled_time: post.scheduled_time,
      platform: post.platform,
      caption: post.caption,
      hashtags: post.hashtags?.join(", ") || "",
      status: post.status
    });
    setShowModal(true);
  };

  const handleLibraryItemSelect = (itemId) => {
    const item = library.find(i => i.id === itemId);
    if (item) {
      setFormData(prev => ({
        ...prev,
        library_item_id: itemId,
        caption: item.caption || prev.caption,
        hashtags: item.hashtags?.join(", ") || prev.hashtags
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.library_item_id) {
      toast.error("Please select a post from library");
      return;
    }

    try {
      if (selectedPost) {
        // Update existing
        await api.put(`/calendar/posts/${selectedPost.id}`, {
          library_item_id: formData.library_item_id,
          scheduled_date: selectedDate,
          scheduled_time: formData.scheduled_time,
          platform: formData.platform,
          caption: formData.caption,
          hashtags: formData.hashtags.split(",").map(t => t.trim()).filter(Boolean),
          status: formData.status
        });
        toast.success("Post updated!");
      } else {
        // Create new
        await api.post("/calendar/schedule", {
          library_item_id: formData.library_item_id,
          scheduled_date: selectedDate,
          scheduled_time: formData.scheduled_time,
          platform: formData.platform,
          caption: formData.caption,
          hashtags: formData.hashtags.split(",").map(t => t.trim()).filter(Boolean),
          status: formData.status
        });
        toast.success("Post scheduled!");
      }
      
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error("Failed to save post");
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Delete this scheduled post?")) return;
    
    try {
      await api.delete(`/calendar/posts/${postId}`);
      toast.success("Post deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </ClientLayout>
    );
  }

  const days = getDaysInMonth();

  return (
    <ClientLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <CalendarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-outfit text-slate-900">Calendar</h1>
              <p className="text-slate-600">Schedule and manage your posts</p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("month")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "month" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "week" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-slate-900">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-slate-500 bg-slate-50">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {days.map((dayObj, i) => {
              const posts = dayObj.date ? getPostsForDate(dayObj.date) : [];
              const isToday = dayObj.date === new Date().toISOString().split('T')[0];
              
              return (
                <div
                  key={i}
                  onClick={() => dayObj.date && openScheduleModal(dayObj.date)}
                  className={`min-h-[100px] p-2 border-b border-r border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                    !dayObj.day ? "bg-slate-50/50" : ""
                  }`}
                >
                  {dayObj.day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isToday 
                          ? "w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center" 
                          : "text-slate-700"
                      }`}>
                        {dayObj.day}
                      </div>
                      
                      {/* Post dots */}
                      <div className="space-y-1">
                        {posts.slice(0, 3).map((post, j) => (
                          <div
                            key={j}
                            onClick={(e) => { e.stopPropagation(); openEditModal(post); }}
                            className={`text-xs truncate px-2 py-1 rounded ${
                              post.status === "published" 
                                ? "bg-green-100 text-green-700"
                                : post.status === "draft"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {post.scheduled_time} - {post.platform.split("_")[1]}
                          </div>
                        ))}
                        {posts.length > 3 && (
                          <div className="text-xs text-slate-500">+{posts.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedPost ? "Edit Post" : "Schedule Post"}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Date */}
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="font-medium text-slate-900">{selectedDate}</p>
                  </div>

                  {/* Library Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select from Library</label>
                    <select
                      value={formData.library_item_id}
                      onChange={(e) => handleLibraryItemSelect(e.target.value)}
                      className="w-full p-3 border rounded-xl text-sm"
                    >
                      <option value="">Choose a post...</option>
                      {library.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.filename || `${item.source} - ${item.type}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Time</label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <Input
                        type="time"
                        value={formData.scheduled_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Platform */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Platform</label>
                    <div className="grid grid-cols-3 gap-2">
                      {platforms.map((plat) => (
                        <button
                          key={plat.id}
                          onClick={() => setFormData(prev => ({ ...prev, platform: plat.id }))}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            formData.platform === plat.id
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-200"
                          }`}
                        >
                          <plat.icon className={`w-5 h-5 ${formData.platform === plat.id ? "text-indigo-600" : "text-slate-400"}`} />
                          <span className="text-xs">{plat.label.split(" ")[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Caption</label>
                    <Textarea
                      value={formData.caption}
                      onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="Write your caption..."
                      rows={3}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Hashtags */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Hashtags</label>
                    <Input
                      value={formData.hashtags}
                      onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                      placeholder="#cafe, #coffee, #foodie"
                      className="rounded-xl"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <div className="flex gap-2">
                      {["scheduled", "draft"].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFormData(prev => ({ ...prev, status }))}
                          className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                            formData.status === status
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  {selectedPost && (
                    <Button
                      onClick={() => handleDelete(selectedPost.id)}
                      variant="outline"
                      className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 rounded-full bg-indigo-600"
                  >
                    {selectedPost ? "Update" : "Schedule"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
