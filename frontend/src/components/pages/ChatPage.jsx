import { useEffect, useRef, useState } from "react";
import { Box, Flex, Text, Input, Button, Stack, HStack } from "@chakra-ui/react";
import bg from "../../assets/snowy.jpg";
import { connectSocket, getSocket, disconnectSocket } from "../../socket";
import { fetchAllUsers } from "../../api/users";
import { fetchPublicHistory, fetchDMHistory } from "../../api/messages";
import { SettingsPanel } from "./SettingsPanel";

export function ChatPage({ user, onLogout }) {
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [openDMs, setOpenDMs] = useState([]);
  const [activeChat, setActiveChat] = useState({ type: "public" });
  const [messages, setMessages] = useState({ public: [], dms: {} });
  const [loadedDMs, setLoadedDMs] = useState(new Set()); // which DM threads we've fetched history for
  const [draft, setDraft] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef(null);

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

    fetchAllUsers(user.token).then(setAllUsers).catch((err) => console.error(err));

    // Load public history once on mount
    fetchPublicHistory(user.token)
      .then((history) => setMessages((prev) => ({ ...prev, public: history })))
      .catch((err) => console.error("Failed to load public history:", err));

    return () => {
      socket.off("presence:update");
      socket.off("message:public");
      socket.off("message:dm");
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

    // Fetch history the first time this thread is opened, not on every click
    if (!loadedDMs.has(username)) {
      try {
        const history = await fetchDMHistory(user.token, username);
        setMessages((prev) => ({ ...prev, dms: { ...prev.dms, [username]: history } }));
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
            <Stack gap={3}>
              {activeMessages.length === 0 && (
                <Text fontSize="sm" color="whiteAlpha.500">No messages yet.</Text>
              )}
              {activeMessages.map((m, i) => {
                const author = m.username || m.fromUsername || m.from;
                const mine = author === user.username;
                return (
                  <Box key={i} alignSelf={mine ? "flex-end" : "flex-start"} maxW="75%">
                    <Text fontSize="xs" color="whiteAlpha.500" mb={0.5}>
                      {mine ? "You" : author} ·{" "}
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    <Box
                      bg={mine ? "whiteAlpha.300" : "whiteAlpha.100"} color="whiteAlpha.900"
                      px={3} py={2} borderRadius="md" fontSize="sm"
                    >
                      {m.content}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <HStack p={3} borderTop="1px solid" borderColor="whiteAlpha.300">
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
