import { useState } from "react";
import { Box, Flex, Text, Input, Button, Stack, Field } from "@chakra-ui/react";
import { changePassword, deleteAccount } from "../../api/account";

export function SettingsPanel({ user, onClose, onAccountDeleted }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwMessage("");
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(user.token, { currentPassword, newPassword });
      setPwMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm.");
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount(user.token, deletePassword);
      onAccountDeleted?.();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Flex
      position="fixed" inset="0" bg="blackAlpha.700"
      align="center" justify="center" zIndex={10}
      onClick={onClose}
    >
      <Box
        w="380px"
        bg="blackAlpha.800"
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor="whiteAlpha.300"
        borderRadius="md"
        p={6}
        onClick={(e) => e.stopPropagation()} // don't close when clicking inside the panel
      >
        <Text fontFamily="serif" fontSize="lg" color="whiteAlpha.900" mb={6}>
          Settings — {user.username}
        </Text>

        {/* Change password */}
        <Text fontSize="sm" color="whiteAlpha.700" mb={2}>Change Password</Text>
        <form onSubmit={handleChangePassword}>
          <Stack gap={3} mb={6}>
            <Field.Root>
              <Input
                type="password"
                placeholder="current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                bg="whiteAlpha.100" color="white" borderColor="whiteAlpha.400"
                _placeholder={{ color: "whiteAlpha.500" }}
              />
            </Field.Root>
            <Field.Root>
              <Input
                type="password"
                placeholder="new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                bg="whiteAlpha.100" color="white" borderColor="whiteAlpha.400"
                _placeholder={{ color: "whiteAlpha.500" }}
              />
            </Field.Root>
            {pwError && <Text fontSize="xs" color="red.300">{pwError}</Text>}
            {pwMessage && <Text fontSize="xs" color="green.300">{pwMessage}</Text>}
            <Button
              type="submit" loading={pwLoading} size="sm"
              bg="whiteAlpha.900" color="blackAlpha.900" _hover={{ bg: "white" }}
            >
              Update Password
            </Button>
          </Stack>
        </form>

        {/* Delete account */}
        <Box borderTop="1px solid" borderColor="whiteAlpha.300" pt={4}>
          <Text fontSize="sm" color="red.300" mb={2}>Delete Account</Text>
          {!confirmingDelete ? (
            <Button
              size="sm" variant="outline" borderColor="red.400" color="red.300"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete my account
            </Button>
          ) : (
            <Stack gap={3}>
              <Text fontSize="xs" color="whiteAlpha.700">
                This permanently deletes your account and all your messages. Enter your password to confirm.
              </Text>
              <Input
                type="password"
                placeholder="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                bg="whiteAlpha.100" color="white" borderColor="whiteAlpha.400"
                _placeholder={{ color: "whiteAlpha.500" }}
              />
              {deleteError && <Text fontSize="xs" color="red.300">{deleteError}</Text>}
              <Button
                size="sm" loading={deleteLoading}
                bg="red.500" color="white" _hover={{ bg: "red.600" }}
                onClick={handleDelete}
              >
                Confirm Delete
              </Button>
            </Stack>
          )}
        </Box>

        <Button mt={6} size="sm" variant="ghost" color="whiteAlpha.700" onClick={onClose}>
          Close
        </Button>
      </Box>
    </Flex>
  );
}
