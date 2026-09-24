import { Box, Flex, Field, Input, Button, Text, Stack, Link as ChakraLink } from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import bg from "../../assets/snowy.jpg";
import { registerUser } from "../../api/auth";

export function RegisterPage({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Enter both username and password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({ username, password });
      onRegister?.(data); // { token, username }
    } catch (err) {
      // Backend sends a real message (e.g. "Username already taken.") — show it directly
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" w="100%" bgImage={`url(${bg})`} bgSize="cover" bgPos="center">
      <Flex minH="100vh" align="center" justify="center" px={4}>
        <Box
          w="380px"
          bg="blackAlpha.600"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="whiteAlpha.300"
          borderRadius="md"
          px={8}
          py={10}
          boxShadow="dark-lg"
        >
          <Text
            fontFamily="serif"
            fontSize="2xl"
            fontWeight="semibold"
            color="whiteAlpha.900"
            letterSpacing="wide"
            mb={8}
            textAlign="center"
          >
            Create Account
          </Text>

          <form onSubmit={handleSubmit}>
            <Stack gap={5}>
              <Field.Root>
                <Field.Label color="whiteAlpha.800" fontSize="sm">Username</Field.Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  bg="whiteAlpha.100" color="white" borderColor="whiteAlpha.400"
                  _placeholder={{ color: "whiteAlpha.500" }}
                  _focus={{ borderColor: "whiteAlpha.700" }}
                  placeholder="choose a username"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label color="whiteAlpha.800" fontSize="sm">Password</Field.Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg="whiteAlpha.100" color="white" borderColor="whiteAlpha.400"
                  _placeholder={{ color: "whiteAlpha.500" }}
                  _focus={{ borderColor: "whiteAlpha.700" }}
                  placeholder="at least 6 characters"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label color="whiteAlpha.800" fontSize="sm">Confirm Password</Field.Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  bg="whiteAlpha.100" color="white" borderColor="whiteAlpha.400"
                  _placeholder={{ color: "whiteAlpha.500" }}
                  _focus={{ borderColor: "whiteAlpha.700" }}
                  placeholder="••••••••"
                />
              </Field.Root>

              {error && <Text color="red.300" fontSize="sm">{error}</Text>}

              <Button
                type="submit"
                loading={loading}
                bg="whiteAlpha.900" color="blackAlpha.900"
                _hover={{ bg: "white" }}
                borderRadius="sm"
                mt={2}
              >
                Register
              </Button>

              <Text textAlign="center" fontSize="sm" color="whiteAlpha.700">
                Already have an account?{" "}
                <ChakraLink as={RouterLink} to="/" color="whiteAlpha.900" fontWeight="semibold">
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
