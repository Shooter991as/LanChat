import { useEffect, useRef, useState } from "react";
import { Box, Flex, Text, Input, Button, Stack, HStack } from "@chakra-ui/react";
import { connectSocket, getSocket, disconnectSocket } from "../../socket";
import { fetchAllUsers } from "../../api/users";
import { fetchPublicHistory, fetchDMHistory } from "../../api/messages";
import { uploadFile } from "../../api/upload";
import { SettingsPanel } from "./SettingsPanel";
import { AttachmentMenu } from "./AttachmentMenu";
import { MessageBubble } from "./MessageBubble";
import { SelectionBar } from "./SelectionBar";
import { colors, appBackground } from "../../theme/colors";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function ChatPage({ user, onLogout }) {
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [openDMs, setOpenDMs] = useState([]);
  const [activeChat, setActiveChat] = useState({ type: "public" });
  const [messages, setMessages] = useState({ public: [], dms: {} });
  const [loadedDMs, setLoadedDMs] = useState(new Set());
  const [draft, setDraft] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Mobile layout: sidebars become overlay drawers instead of fixed columns
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Long-press / tap-to-select message deletion
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const socket = connectSocket(user.token);

    socket.on("presence:update", (usernames) => setOnlineUsers(usernames));

    socket.on("message:public", (msg) => {
      setMessages((prev) => ({ ...prev, public: [...prev.public, msg] }));
    });

    socket.on("message:dm", (msg) => {
      const otherParty = msg.fromUsername === user.username ? msg.toUsername : msg.fromUsername;
      setMessages((prev) => {
        const thread = prev.dms[otherParty] || [];
        return { ...prev, dms: { ...prev.dms, [otherParty]: [...thread, msg] } };
      });
      setOpenDMs((prev) => (prev.includes(otherParty) ? prev : [...prev, otherParty]));
    });

    // Accepts either a single `id` (legacy) or a bulk `ids` array
    socket.on("message:deleted", ({ id, ids, scope, withUser }) => {
      const deletedIds = new Set(ids || [id]);
      setMessages((prev) => {
        if (scope === "public") {
          return { ...prev, public: prev.public.filter((m) => !deletedIds.has(m.id)) };
        }
        const thread = prev.dms[withUser] || [];
        return { ...prev, dms: { ...prev.dms, [withUser]: thread.filter((m) => !deletedIds.has(m.id)) } };
      });
    });

    fetchAllUsers(user.token).then(setAllUsers).catch((err) => console.error(err));

    fetchPublicHistory(user.token)
      .then((history) => {
        const normalized = history.map((m) => ({ ...m, id: m._id }));
        setMessages((prev) => ({ ...prev, public: normalized }));
      })
      .catch((err) => console.error("Failed to load public history:", err));

    return () => {
      socket.off("presence:update");
      socket.off("message:public");
      socket.off("message:dm");
      socket.off("message:deleted");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, activeChat]);

  const handleLogout = () => {
    disconnectSocket();
    onLogout?.();
  };

  const openDM = async (username) => {
    if (username === user.username) return;
    setOpenDMs((prev) => (prev.includes(username) ? prev : [...prev, username]));
    setActiveChat({ type: "dm", username });
    setRightOpen(false); // close the drawer after picking someone, on mobile

    if (!loadedDMs.has(username)) {
      try {
        const history = await fetchDMHistory(user.token, username);
        const normalized = history.map((m) => ({ ...m, id: m._id }));
        setMessages((prev) => ({ ...prev, dms: { ...prev.dms, [username]: normalized } }));
        setLoadedDMs((prev) => new Set(prev).add(username));
      } catch (err) {
        console.error("Failed to load DM history:", err);
      }
    }
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    const socket = getSocket();
    if (activeChat.type === "public") {
      socket.emit("message:public", { content: text });
    } else {
      socket.emit("message:dm", { toUsername: activeChat.username, content: text });
    }
    setDraft("");
  };

  const handleAttachmentTypeSelected = (type) => {
    setShowAttachMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type.accept === "*" ? "" : type.accept;
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { url, originalName } = await uploadFile(user.token, file);
      const socket = getSocket();
      if (activeChat.type === "public") {
        socket.emit("message:public", { content: "", mediaUrl: url, mediaName: originalName });
      } else {
        socket.emit("message:dm", { toUsername: activeChat.username, content: "", mediaUrl: url, mediaName: originalName });
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      e.target.value = "";
    }
  };

  const quickDelete = (id) => {
    getSocket().emit("message:delete", { id });
  };

  const enterSelection = (id) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      if (next.size === 0) setSelectionMode(false);
      return next;
    });
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const bulkDelete = () => {
    if (selectedIds.size === 0) return;
    getSocket().emit("message:delete", { ids: Array.from(selectedIds) });
    cancelSelection();
  };

  const activeMessages =
    activeChat.type === "public" ? messages.public : messages.dms[activeChat.username] || [];
  const activeTitle = activeChat.type === "public" ? "Public" : activeChat.username;

  const leftSidebarContent = (
    <>
      <Text fontFamily="serif" fontSize="lg" color={colors.textHi} mb={4}>LAN Chat</Text>

      <Text fontSize="xs" color={colors.textDim} mb={2} letterSpacing="wide">CHANNELS</Text>
      <Box
        px={2} py={2} mb={4} borderRadius="md" cursor="pointer"
        bg={activeChat.type === "public" ? colors.panelRaised : "transparent"}
        color={colors.textHi}
        onClick={() => { setActiveChat({ type: "public" }); setLeftOpen(false); }}
      >
        # Public
      </Box>

      <Text fontSize="xs" color={colors.textDim} mb={2} letterSpacing="wide">DIRECT MESSAGES</Text>
      <Stack gap={1}>
        {openDMs.length === 0 && (
          <Text fontSize="sm" color={colors.textDim}>Open a user from the list to start a DM</Text>
        )}
        {openDMs.map((username) => (
          <Box
            key={username}
            px={2} py={2} borderRadius="md" cursor="pointer"
            bg={activeChat.type === "dm" && activeChat.username === username ? colors.panelRaised : "transparent"}
            color={colors.textHi}
            onClick={() => { setActiveChat({ type: "dm", username }); setLeftOpen(false); }}
          >
            {username}
          </Box>
        ))}
      </Stack>

      <Box mt="auto" pt={4}>
        <Button size="sm" variant="outline" borderColor={colors.border} color={colors.textMid} w="full" mb={2} onClick={() => setShowSettings(true)}>
          Settings
        </Button>
        <Button size="sm" variant="outline" borderColor={colors.border} color={colors.textMid} w="full" onClick={handleLogout}>
          Log out
        </Button>
      </Box>
    </>
  );

  const rightSidebarContent = (
    <>
      <Text fontSize="xs" color={colors.textDim} mb={3} letterSpacing="wide">
        USERS — {onlineUsers.length} ONLINE
      </Text>
      <Stack gap={1}>
        {allUsers.map((username) => {
          const isOnline = onlineUsers.includes(username);
          const isMe = username === user.username;
          return (
            <HStack
              key={username} px={2} py={2} borderRadius="md"
              cursor={isMe ? "default" : "pointer"}
              _hover={{ bg: isMe ? "transparent" : colors.panelRaised }}
              onClick={() => !isMe && openDM(username)}
            >
              <Box w="8px" h="8px" borderRadius="full" flexShrink={0} bg={isOnline ? colors.online : colors.textDim} />
              <Text fontSize="sm" color={colors.textHi}>{username} {isMe ? "(you)" : ""}</Text>
            </HStack>
          );
        })}
      </Stack>
    </>
  );

  return (
    <Box h="100dvh" w="100%" overflow="hidden" {...appBackground}>
      <Flex h="100%" direction="column">
        {/* Mobile-only top bar: opens the two drawers that replace fixed sidebars */}
        <Flex
          display={{ base: "flex", md: "none" }}
          align="center" justify="space-between"
          px={4} py={3} borderBottom="1px solid" borderColor={colors.border}
          bg={colors.panel}
        >
          <Button size="sm" variant="ghost" color={colors.textHi} onClick={() => setLeftOpen(true)}>☰</Button>
          <Text color={colors.textHi} fontWeight="semibold" fontSize="sm">
            {activeChat.type === "public" ? "# Public" : activeTitle}
          </Text>
          <Button size="sm" variant="ghost" color={colors.textHi} onClick={() => setRightOpen(true)}>👥</Button>
        </Flex>

        <Flex flex="1" minH={0} p={{ base: 0, md: 4 }} gap={{ base: 0, md: 4 }}>
          {/* Left sidebar: fixed column on desktop, slide-over drawer on mobile */}
          <Box
            display={{ base: leftOpen ? "flex" : "none", md: "flex" }}
            flexDirection="column"
            position={{ base: "fixed", md: "relative" }}
            inset={{ base: 0, md: "auto" }}
            zIndex={{ base: 20, md: "auto" }}
            w={{ base: "100%", md: "230px" }}
            minW={{ md: "230px" }}
            bg={colors.panel}
            borderRight={{ md: "1px solid" }}
            borderColor={colors.border}
            borderRadius={{ base: 0, md: "lg" }}
            p={4}
            overflowY="auto"
          >
            <Flex display={{ base: "flex", md: "none" }} justify="flex-end" mb={2}>
              <Button size="sm" variant="ghost" color={colors.textMid} onClick={() => setLeftOpen(false)}>✕</Button>
            </Flex>
            {leftSidebarContent}
          </Box>

          {/* Center: active conversation */}
          <Flex
            flex="1" minH={0} direction="column"
            bg={colors.panel}
            border={{ md: "1px solid" }}
            borderColor={colors.border}
            borderRadius={{ base: 0, md: "lg" }}
            overflow="hidden"
            position="relative"
          >
            {selectionMode ? (
              <SelectionBar count={selectedIds.size} onCancel={cancelSelection} onDelete={bulkDelete} />
            ) : (
              <Box display={{ base: "none", md: "block" }} px={5} py={3} borderBottom="1px solid" borderColor={colors.border}>
                <Text color={colors.textHi} fontWeight="semibold">
                  {activeChat.type === "public" ? "# " : ""}{activeTitle}
                </Text>
              </Box>
            )}

            <Box ref={scrollRef} flex="1" minH={0} overflowY="auto" px={5} py={4}>
              <Stack gap={0.5}>
                {activeMessages.length === 0 && (
                  <Text fontSize="sm" color={colors.textDim}>No messages yet.</Text>
                )}
                {activeMessages.map((m, i) => {
                  const author = m.username || m.fromUsername || m.from;
                  const mine = author === user.username;
                  const prev = activeMessages[i - 1];
                  const prevAuthor = prev ? prev.username || prev.fromUsername || prev.from : null;
                  const gapMs = prev ? Math.abs(new Date(m.timestamp) - new Date(prev.timestamp)) : Infinity;
                  const isGrouped = prevAuthor === author && gapMs < GROUP_WINDOW_MS;

                  return (
                    <Box key={m.id} mt={isGrouped ? 0.5 : 3}>
                      {!isGrouped && (
                        <Flex justify={mine ? "flex-end" : "flex-start"} mb={0.5}>
                          <Text fontSize="xs" color={colors.textDim}>
                            {mine ? "You" : author} ·{" "}
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Text>
                        </Flex>
                      )}
                      <MessageBubble
                        message={m}
                        mine={mine}
                        isGrouped={isGrouped}
                        author={author}
                        selectionMode={selectionMode}
                        selected={selectedIds.has(m.id)}
                        onEnterSelection={enterSelection}
                        onToggleSelect={toggleSelect}
                        onQuickDelete={quickDelete}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {showAttachMenu && (
              <AttachmentMenu onSelect={handleAttachmentTypeSelected} onClose={() => setShowAttachMenu(false)} />
            )}

            <HStack p={3} borderTop="1px solid" borderColor={colors.border}>
              <input type="file" ref={fileInputRef} onChange={handleFileSelected} style={{ display: "none" }} />
              <Button onClick={() => setShowAttachMenu((v) => !v)} variant="ghost" color={colors.textMid} px={2} title="Attach a file">
                📎
              </Button>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={`Message ${activeChat.type === "public" ? "#public" : activeTitle}...`}
                bg={colors.panelRaised} color={colors.textHi} borderColor={colors.border}
                _placeholder={{ color: colors.textDim }}
                _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
              />
              <Button onClick={sendMessage} bg={colors.accent} color="white" _hover={{ bg: colors.accentHover }}>
                Send
              </Button>
            </HStack>
          </Flex>

          {/* Right sidebar: fixed column on desktop, slide-over drawer on mobile */}
          <Box
            display={{ base: rightOpen ? "flex" : "none", md: "flex" }}
            flexDirection="column"
            position={{ base: "fixed", md: "relative" }}
            inset={{ base: 0, md: "auto" }}
            zIndex={{ base: 20, md: "auto" }}
            w={{ base: "100%", md: "230px" }}
            minW={{ md: "230px" }}
            bg={colors.panel}
            borderLeft={{ md: "1px solid" }}
            borderColor={colors.border}
            borderRadius={{ base: 0, md: "lg" }}
            p={4}
            overflowY="auto"
          >
            <Flex display={{ base: "flex", md: "none" }} justify="flex-end" mb={2}>
              <Button size="sm" variant="ghost" color={colors.textMid} onClick={() => setRightOpen(false)}>✕</Button>
            </Flex>
            {rightSidebarContent}
          </Box>
        </Flex>
      </Flex>

      {showSettings && (
        <SettingsPanel user={user} onClose={() => setShowSettings(false)} onAccountDeleted={handleLogout} />
      )}
    </Box>
  );
}
