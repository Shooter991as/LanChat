import { Box, Flex, Field, Input, Button, Text, Stack, Link as ChakraLink } from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { registerUser } from "../../api/auth";
import { isStrongPassword } from "../../utils/validation";
import { PasswordChecklist } from "./PasswordChecklist";
import { colors, appBackground } from "../../theme/colors";

export function RegisterPage({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Enter both username and password.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Password doesn't meet the requirements below.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const data = await registerUser({ username, password });
      onRegister?.(data);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100dvh" w="100%" {...appBackground}>
      <Flex minH="100dvh" align="center" justify="center" px={4} py={8}>
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
          <Text
            fontFamily="serif" fontSize="2xl" fontWeight="semibold" color={colors.textHi}
            letterSpacing="wide" mb={8} textAlign="center"
          >
            Create Account
          </Text>

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
                  placeholder="choose a username"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label color={colors.textMid} fontSize="sm">Password</Field.Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  bg={colors.panelRaised} color={colors.textHi} borderColor={colors.border}
                  _placeholder={{ color: colors.textDim }}
                  _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                  placeholder="choose a strong password"
                />
                {(passwordFocused || password) && <PasswordChecklist password={password} />}
              </Field.Root>

              <Field.Root>
                <Field.Label color={colors.textMid} fontSize="sm">Confirm Password</Field.Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                Register
              </Button>

              <Text textAlign="center" fontSize="sm" color={colors.textMid}>
                Already have an account?{" "}
                <ChakraLink as={RouterLink} to="/" color={colors.textHi} fontWeight="semibold">
                  Log in
                </ChakraLink>
              </Text>
            </Stack>
          </form>
        </Box>
      </Flex>
    </Box>
  );
}
