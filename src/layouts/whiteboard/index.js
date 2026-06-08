import { useCallback, useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import { Tldraw, getSnapshot, loadSnapshot } from "@tldraw/tldraw";
import "tldraw/tldraw.css";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiInput from "components/VuiInput";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { getSupabase } from "lib/supabaseClient";
import { useAuth } from "context/AuthContext";

function BoardEditor({ board, onBack, onRename }) {
  const { session } = useAuth();
  const editorRef = useRef(null);
  const saveTimer = useRef(null);
  const remoteTimer = useRef(null);

  const persist = useCallback(
    async (editor) => {
      if (!editor || !board?.id) return;
      const snapshot = getSnapshot(editor.store);
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase
        .from("whiteboards")
        .update({
          snapshot,
          updated_by: session?.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", board.id);
    },
    [board?.id, session?.user?.id]
  );

  useEffect(() => {
    if (!board?.id) return undefined;

    const supabase = getSupabase();
    if (!supabase) return undefined;

    const channel = supabase
      .channel(`whiteboard-${board.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "whiteboards", filter: `id=eq.${board.id}` },
        (payload) => {
          const editor = editorRef.current;
          if (!editor || payload.new.updated_by === session?.user?.id) return;
          clearTimeout(remoteTimer.current);
          remoteTimer.current = setTimeout(() => {
            if (payload.new.snapshot) loadSnapshot(editor.store, payload.new.snapshot);
          }, 300);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [board?.id, session?.user?.id]);

  return (
    <VuiBox>
      <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <VuiBox display="flex" gap={1} alignItems="center">
          <VuiButton color="secondary" size="small" onClick={onBack}>
            Back
          </VuiButton>
          <VuiInput value={board.title} onChange={(e) => onRename(e.target.value)} />
        </VuiBox>
        <VuiTypography color="text" variant="caption">
          Changes auto-save
        </VuiTypography>
      </VuiBox>
      <VuiBox height="70vh" borderRadius="xl" overflow="hidden" sx={{ backgroundColor: "#111827" }}>
        <Tldraw
          onMount={(editor) => {
            editorRef.current = editor;
            if (board.snapshot && Object.keys(board.snapshot).length) {
              loadSnapshot(editor.store, board.snapshot);
            }
            editor.store.listen(() => {
              clearTimeout(saveTimer.current);
              saveTimer.current = setTimeout(() => persist(editor), 2000);
            });
          }}
        />
      </VuiBox>
    </VuiBox>
  );
}

function Whiteboard() {
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [titleDraft, setTitleDraft] = useState("Strategy board");
  const [error, setError] = useState("");

  const loadBoards = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data, error: fetchError } = await supabase.from("whiteboards").select("*").order("updated_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    else setBoards(data || []);
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const createBoard = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data, error: insertError } = await supabase
      .from("whiteboards")
      .insert({ title: titleDraft || "Untitled board", snapshot: {} })
      .select("*")
      .single();
    if (insertError) setError(insertError.message);
    else {
      setActiveBoard(data);
      loadBoards();
    }
  };

  const deleteBoard = async (id) => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from("whiteboards").delete().eq("id", id);
    if (activeBoard?.id === id) setActiveBoard(null);
    loadBoards();
  };

  const renameBoard = async (title) => {
    const supabase = getSupabase();
    if (!activeBoard || !supabase) return;
    const updated = { ...activeBoard, title };
    setActiveBoard(updated);
    await supabase.from("whiteboards").update({ title }).eq("id", activeBoard.id);
    loadBoards();
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3}>
        <VuiTypography variant="h4" color="white" fontWeight="bold" mb={3}>
          Whiteboard
        </VuiTypography>
        {error && (
          <VuiBox mb={2} p={2} borderRadius="lg" sx={{ backgroundColor: "rgba(227,26,26,0.15)" }}>
            <VuiTypography color="error">{error}</VuiTypography>
          </VuiBox>
        )}

        {activeBoard ? (
          <BoardEditor board={activeBoard} onBack={() => setActiveBoard(null)} onRename={renameBoard} />
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <VuiBox p={3} borderRadius="xl" sx={{ backgroundColor: "rgba(15,20,40,0.65)" }}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb={2}>
                  New board
                </VuiTypography>
                <VuiInput value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} placeholder="Board name" sx={{ mb: 2 }} />
                <VuiButton color="info" onClick={createBoard} fullWidth>
                  Create board
                </VuiButton>
              </VuiBox>
            </Grid>
            <Grid item xs={12} md={8}>
              <VuiBox p={3} borderRadius="xl" sx={{ backgroundColor: "rgba(15,20,40,0.65)" }}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb={2}>
                  Your boards
                </VuiTypography>
                {boards.map((board) => (
                  <VuiBox key={board.id} display="flex" justifyContent="space-between" alignItems="center" py={1.5} borderBottom="1px solid rgba(255,255,255,0.06)">
                    <VuiBox>
                      <VuiTypography color="white">{board.title}</VuiTypography>
                      <VuiTypography variant="caption" color="text">
                        Updated {new Date(board.updated_at).toLocaleString()}
                      </VuiTypography>
                    </VuiBox>
                    <VuiBox display="flex" gap={1}>
                      <VuiButton size="small" color="info" onClick={() => setActiveBoard(board)}>
                        Open
                      </VuiButton>
                      <VuiButton size="small" color="error" onClick={() => deleteBoard(board.id)}>
                        Delete
                      </VuiButton>
                    </VuiBox>
                  </VuiBox>
                ))}
                {!boards.length && <VuiTypography color="text">No boards yet — create one to start planning.</VuiTypography>}
              </VuiBox>
            </Grid>
          </Grid>
        )}
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Whiteboard;
