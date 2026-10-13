import { Box, Flex, Field, Input, Button, Text, Stack, Link as ChakraLink } from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { loginUser } from "../../api/auth";
import { colors, appBackground } from "../../theme/colors";

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Enter both username and password.");
      return;
    }
    setLoading(true);
    try {
      const data = await loginUser({ username, password });
      onLogin?.(data);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 100dvh (not 100vh) — on Android Chrome, 100vh includes the address bar
    // and causes the page to resize/jump when it hides; dvh tracks the real
    // visible viewport instead.
    <Box minH="100dvh" w="100%" {...appBackground}>
      <Flex minH="100dvh" align="center" justify="center" px={4}>
        <Box
          w="100%"
          maxW="380px"
          bg={colors.panel}
          border="1px solid"
          borderColor={colors.border}
          borderRadius="lg"
          px={{ base: 6, sm: 8 }}
          py={10}
          boxShadow="0 20px 60px rgba(0,0,0,0.45)"
        >
          <Flex align="center" gap={2} justify="center" mb={8}>
            <Box w="8px" h="8px" borderRadius="full" bg={colors.accent} />
            <Text fontFamily="serif" fontSize="2xl" fontWeight="semibold" color={colors.textHi} letterSpacing="wide">
              LAN Chat
            </Text>
          </Flex>

          <form onSubmit={handleSubmit}>
            <Stack gap={5}>
              <Field.Root>
                <Field.Label color={colors.textMid} fontSize="sm">Username</Field.Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  bg={colors.panelRaised} color={colors.textHi} borderColor={colors.border}
                  _placeholder={{ color: colors.textDim }}
                  _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                  placeholder="your username"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label color={colors.textMid} fontSize="sm">Password</Field.Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg={colors.panelRaised} color={colors.textHi} borderColor={colors.border}
                  _placeholder={{ color: colors.textDim }}
                  _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                  placeholder="••••••••"
                />
              </Field.Root>

              {error && <Text color={colors.danger} fontSize="sm">{error}</Text>}

              <Button
                type="submit"
                loading={loading}
                bg={colors.accent}
                color="white"
                _hover={{ bg: colors.accentHover }}
                borderRadius="md"
                mt={2}
              >
                Log In
              </Button>

              <Text textAlign="center" fontSize="sm" color={colors.textMid}>
                Don't have an account?{" "}
                <ChakraLink as={RouterLink} to="/register" color={colors.textHi} fontWeight="semibold">
                  Register
                </ChakraLink>
              </Text>
            </Stack>
          </form>
        </Box>
      </Flex>
    </Box>
  );
}
