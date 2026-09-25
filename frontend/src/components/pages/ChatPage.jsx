import { useEffect, useRef, useState } from "react";
import { Box, Flex, Text, Input, Button, Stack, HStack } from "@chakra-ui/react";
import bg from "../../assets/snowy.jpg";
import { connectSocket, getSocket, disconnectSocket } from "../../socket";
import { fetchAllUsers } from "../../api/users";
import { fetchPublicHistory, fetchDMHistory } from "../../api/messages";
import { uploadFile } from "../../api/upload";
import { SERVER_URL } from "../../config";
import { SettingsPanel } from "./SettingsPanel";

const GROUP_WINDOW_MS = 5 * 60 * 1000; // messages within 5 min of same author stack together

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;

export function ChatPage({ user, onLogout }) {
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [openDMs, setOpenDMs] = useState([]);
  const [activeChat, setActiveChat] = useState({ type: "public" });
  const [messages, setMessages] = useState({ public: [], dms: {} });
  const [loadedDMs, setLoadedDMs] = useState(new Set());
  const [draft, setDraft] = useState("");
  const [showSettings, setShowSettings] = useState(false);
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

    socket.on("message:deleted", ({ id, scope, withUser }) => {
      setMessages((prev) => {
        if (scope === "public") {
          return { ...prev, public: prev.public.filter((m) => m.id !== id) };
        }
        const thread = prev.dms[withUser] || [];
        return { ...prev, dms: { ...prev.dms, [withUser]: thread.filter((m) => m.id !== id) } };
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

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { url, originalName } = await uploadFile(user.token, file);
      const socket = getSocket();
      if (activeChat.type === "public") {
        socket.emit("message:public", { content: "", mediaUrl: url, mediaName: originalName });
      } else {
        socket.emit("message:dm", {
          toUsername: activeChat.username,
          content: "",
          mediaUrl: url,
          mediaName: originalName,
        });
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      e.target.value = ""; // allows re-selecting the same file later
    }
  };

  const handleDelete = (id) => {
    getSocket().emit("message:delete", { id });
  };

  const activeMessages =
    activeChat.type === "public" ? messages.public : messages.dms[activeChat.username] || [];
  const activeTitle = activeChat.type === "public" ? "Public" : activeChat.username;

  return (
    <Box h="100vh" w="100%" overflow="hidden" bgImage={`url(${bg})`} bgSize="cover" bgPos="center">
      <Flex h="100%" p={4} gap={4}>
        {/* Left: conversations */}
        <Box
          w="220px" bg="blackAlpha.600" backdropFilter="blur(10px)"
          border="1px solid" borderColor="whiteAlpha.300" borderRadius="md"
          p={4} overflowY="auto" display="flex" flexDirection="column"
        >
          <Text fontFamily="serif" fontSize="lg" color="whiteAlpha.900" mb={4}>LAN Chat</Text>

          <Text fontSize="xs" color="whiteAlpha.500" mb={2} letterSpacing="wide">CHANNELS</Text>
          <Box
            px={2} py={2} mb={4} borderRadius="sm" cursor="pointer"
            bg={activeChat.type === "public" ? "whiteAlpha.200" : "transparent"}
            color="whiteAlpha.900"
            onClick={() => setActiveChat({ type: "public" })}
          >
            # Public
          </Box>

          <Text fontSize="xs" color="whiteAlpha.500" mb={2} letterSpacing="wide">DIRECT MESSAGES</Text>
          <Stack gap={1}>
            {openDMs.length === 0 && (
              <Text fontSize="sm" color="whiteAlpha.500">Click a user on the right to start a DM</Text>
            )}
            {openDMs.map((username) => (
              <Box
                key={username}
                px={2} py={2} borderRadius="sm" cursor="pointer"
                bg={activeChat.type === "dm" && activeChat.username === username ? "whiteAlpha.200" : "transparent"}
                color="whiteAlpha.900"
                onClick={() => openDM(username)}
              >
                {username}
              </Box>
            ))}
          </Stack>

          <Box mt="auto" pt={4}>
            <Button
              size="sm" variant="outline" borderColor="whiteAlpha.400" color="whiteAlpha.800"
              w="full" mb={2} onClick={() => setShowSettings(true)}
            >
              Settings
            </Button>
            <Button
              size="sm" variant="outline" borderColor="whiteAlpha.400" color="whiteAlpha.800" w="full"
              onClick={handleLogout}
            >
              Log out
            </Button>
          </Box>
        </Box>

        {/* Center: active conversation */}
        <Flex
          flex="1" minH={0} direction="column" bg="blackAlpha.600" backdropFilter="blur(10px)"
          border="1px solid" borderColor="whiteAlpha.300" borderRadius="md" overflow="hidden"
        >
          <Box px={5} py={3} borderBottom="1px solid" borderColor="whiteAlpha.300">
            <Text color="whiteAlpha.900" fontWeight="semibold">
              {activeChat.type === "public" ? "# " : ""}{activeTitle}
            </Text>
          </Box>

          <Box ref={scrollRef} flex="1" minH={0} overflowY="auto" px={5} py={4}>
            <Stack gap={0.5}>
              {activeMessages.length === 0 && (
                <Text fontSize="sm" color="whiteAlpha.500">No messages yet.</Text>
              )}
              {activeMessages.map((m, i) => {
                const author = m.username || m.fromUsername || m.from;
                const mine = author === user.username;
                const prev = activeMessages[i - 1];
                const prevAuthor = prev ? prev.username || prev.fromUsername || prev.from : null;
                const gapMs = prev ? Math.abs(new Date(m.timestamp) - new Date(prev.timestamp)) : Infinity;
                const isGrouped = prevAuthor === author && gapMs < GROUP_WINDOW_MS;
                const isImage = m.mediaUrl && IMAGE_EXT.test(m.mediaUrl);

                return (
                  <Box key={m.id} alignSelf={mine ? "flex-end" : "flex-start"} maxW="75%" mt={isGrouped ? 0.5 : 3}>
                    {!isGrouped && (
                      <Text fontSize="xs" color="whiteAlpha.500" mb={0.5}>
                        {mine ? "You" : author} ·{" "}
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    )}
                    <Box
                      role="group"
                      position="relative"
                      bg={mine ? "whiteAlpha.300" : "whiteAlpha.100"} color="whiteAlpha.900"
                      px={m.mediaUrl && !m.content ? 1 : 3} py={m.mediaUrl && !m.content ? 1 : 2}
                      borderRadius="md" fontSize="sm"
                    >
                      {m.mediaUrl && (
                        isImage ? (
                          <Box
                            as="img"
                            src={`${SERVER_URL}${m.mediaUrl}`}
                            maxW="240px"
                            borderRadius="sm"
                            display="block"
                          />
                        ) : (
                          <Text
                            as="a"
                            href={`${SERVER_URL}${m.mediaUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            textDecoration="underline"
                            px={m.content ? 0 : 2}
                          >
                            📎 {m.mediaName || "attachment"}
                          </Text>
                        )
                      )}
                      {m.content && <Text mt={m.mediaUrl ? 1 : 0}>{m.content}</Text>}

                      {mine && (
                        <Button
                          size="2xs"
                          variant="ghost"
                          position="absolute"
                          top="-2px"
                          right={mine ? "auto" : "-2px"}
                          left={mine ? "-28px" : "auto"}
                          opacity={0}
                          _groupHover={{ opacity: 1 }}
                          color="whiteAlpha.600"
                          _hover={{ color: "red.300" }}
                          onClick={() => handleDelete(m.id)}
                          title="Unsend"
                        >
                          ✕
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <HStack p={3} borderTop="1px solid" borderColor="whiteAlpha.300">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              style={{ display: "none" }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost" color="whiteAlpha.700" px={2}
              title="Attach a file"
            >
              📎
            </Button>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`Message ${activeChat.type === "public" ? "#public" : activeTitle}...`}
              bg="whiteAlpha.100" color="white" borderColor="whiteAlpha.400"
              _placeholder={{ color: "whiteAlpha.500" }}
            />
            <Button onClick={sendMessage} bg="whiteAlpha.900" color="blackAlpha.900" _hover={{ bg: "white" }}>
              Send
            </Button>
          </HStack>
        </Flex>

        {/* Right: presence */}
        <Box
          w="220px" bg="blackAlpha.600" backdropFilter="blur(10px)"
          border="1px solid" borderColor="whiteAlpha.300" borderRadius="md"
          p={4} overflowY="auto"
        >
          <Text fontSize="xs" color="whiteAlpha.500" mb={3} letterSpacing="wide">
            USERS — {onlineUsers.length} ONLINE
          </Text>
          <Stack gap={1}>
            {allUsers.map((username) => {
              const isOnline = onlineUsers.includes(username);
              const isMe = username === user.username;
              return (
                <HStack
                  key={username} px={2} py={2} borderRadius="sm"
                  cursor={isMe ? "default" : "pointer"}
                  _hover={{ bg: isMe ? "transparent" : "whiteAlpha.100" }}
                  onClick={() => !isMe && openDM(username)}
                >
                  <Box w="8px" h="8px" borderRadius="full" bg={isOnline ? "green.400" : "whiteAlpha.400"} />
                  <Text fontSize="sm" color="whiteAlpha.900">{username} {isMe ? "(you)" : ""}</Text>
                </HStack>
              );
            })}
          </Stack>
        </Box>
      </Flex>

      {showSettings && (
        <SettingsPanel
          user={user}
          onClose={() => setShowSettings(false)}
          onAccountDeleted={handleLogout}
        />
      )}
    </Box>
  );
}
