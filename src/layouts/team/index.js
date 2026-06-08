import { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiInput from "components/VuiInput";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { supabase } from "lib/supabaseClient";
import { useAuth } from "context/AuthContext";
import { formatHours } from "lib/api";

const CHANNEL_ID = "general";

function Team() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [body, setBody] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const loadProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*");
    const map = {};
    (data || []).forEach((p) => {
      map[p.id] = p;
    });
    setProfiles(map);
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("channel_id", CHANNEL_ID)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages(data || []);
  };

  const loadSessions = async () => {
    const { data } = await supabase.from("time_sessions").select("*").order("clock_in", { ascending: false }).limit(50);
    setSessions(data || []);
    setActiveSession((data || []).find((s) => !s.clock_out && s.user_id === userId) || null);
  };

  useEffect(() => {
    if (!supabase) return undefined;
    loadProfiles();
    loadMessages();
    loadSessions();

    const channel = supabase
      .channel("team-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${CHANNEL_ID}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!body.trim() || !userId) return;
    const { error: insertError } = await supabase.from("chat_messages").insert({
      channel_id: CHANNEL_ID,
      sender_id: userId,
      body: body.trim(),
    });
    if (insertError) setError(insertError.message);
    else setBody("");
  };

  const clockIn = async () => {
    const { error: insertError } = await supabase.from("time_sessions").insert({ user_id: userId });
    if (insertError) setError(insertError.message);
    else loadSessions();
  };

  const clockOut = async () => {
    if (!activeSession) return;
    const { error: updateError } = await supabase
      .from("time_sessions")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", activeSession.id);
    if (updateError) setError(updateError.message);
    else loadSessions();
  };

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const weeklyMs = sessions
    .filter((s) => s.clock_out && isWithinInterval(new Date(s.clock_in), { start: weekStart, end: weekEnd }))
    .reduce((sum, s) => sum + (new Date(s.clock_out) - new Date(s.clock_in)), 0);

  const activeUsers = Object.values(
    sessions.reduce((acc, s) => {
      if (!s.clock_out) acc[s.user_id] = s;
      return acc;
    }, {})
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3}>
        <VuiTypography variant="h4" color="white" fontWeight="bold" mb={3}>
          Team
        </VuiTypography>
        {error && (
          <VuiBox mb={2} p={2} borderRadius="lg" sx={{ backgroundColor: "rgba(227,26,26,0.15)" }}>
            <VuiTypography color="error">{error}</VuiTypography>
          </VuiBox>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <VuiBox p={3} borderRadius="xl" sx={{ backgroundColor: "rgba(15,20,40,0.65)", height: "620px", display: "flex", flexDirection: "column" }}>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb={2}>
                #general
              </VuiTypography>
              <VuiBox flex={1} overflow="auto" mb={2}>
                {messages.map((msg) => {
                  const profile = profiles[msg.sender_id];
                  return (
                    <VuiBox key={msg.id} mb={2}>
                      <VuiBox display="flex" alignItems="center" gap={1} mb={0.5}>
                        <VuiBox width="28px" height="28px" borderRadius="50%" sx={{ backgroundColor: profile?.avatar_color || "#0075FF" }} />
                        <VuiTypography color="white" fontWeight="medium">
                          {profile?.display_name || "Teammate"}
                        </VuiTypography>
                        <VuiTypography variant="caption" color="text">
                          {format(new Date(msg.created_at), "MMM d, h:mm a")}
                        </VuiTypography>
                      </VuiBox>
                      <VuiTypography color="text" pl={4}>
                        {msg.body}
                      </VuiTypography>
                    </VuiBox>
                  );
                })}
                <div ref={bottomRef} />
              </VuiBox>
              <form onSubmit={sendMessage}>
                <VuiBox display="flex" gap={1}>
                  <VuiInput placeholder="Message your partner..." value={body} onChange={(e) => setBody(e.target.value)} fullWidth />
                  <VuiButton color="info" type="submit">
                    Send
                  </VuiButton>
                </VuiBox>
              </form>
            </VuiBox>
          </Grid>
          <Grid item xs={12} lg={5}>
            <VuiBox p={3} borderRadius="xl" sx={{ backgroundColor: "rgba(15,20,40,0.65)" }} mb={3}>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb={2}>
                Time clock
              </VuiTypography>
              <VuiBox mb={2}>
                {activeSession ? (
                  <VuiButton color="error" onClick={clockOut} fullWidth>
                    Clock out
                  </VuiButton>
                ) : (
                  <VuiButton color="success" onClick={clockIn} fullWidth>
                    Clock in
                  </VuiButton>
                )}
              </VuiBox>
              <VuiTypography color="text" mb={1}>
                Currently working:
              </VuiTypography>
              {activeUsers.length ? (
                activeUsers.map((s) => (
                  <VuiTypography key={s.id} color="white">
                    • {profiles[s.user_id]?.display_name || "Teammate"}
                  </VuiTypography>
                ))
              ) : (
                <VuiTypography color="text">Nobody clocked in</VuiTypography>
              )}
              <VuiBox mt={2}>
                <VuiTypography color="white" fontWeight="medium">
                  This week: {formatHours(weeklyMs)}
                </VuiTypography>
              </VuiBox>
            </VuiBox>
            <VuiBox p={3} borderRadius="xl" sx={{ backgroundColor: "rgba(15,20,40,0.65)" }}>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb={2}>
                Recent sessions
              </VuiTypography>
              {sessions.slice(0, 8).map((s) => (
                <VuiBox key={s.id} mb={1} display="flex" justifyContent="space-between">
                  <VuiTypography color="text">{profiles[s.user_id]?.display_name || "User"}</VuiTypography>
                  <VuiTypography color="white">
                    {format(new Date(s.clock_in), "MMM d")} ·{" "}
                    {s.clock_out ? formatHours(new Date(s.clock_out) - new Date(s.clock_in)) : "Active"}
                  </VuiTypography>
                </VuiBox>
              ))}
            </VuiBox>
          </Grid>
        </Grid>
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Team;
