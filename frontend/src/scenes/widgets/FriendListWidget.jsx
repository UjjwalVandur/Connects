import { Box, Typography, useTheme } from "@mui/material";
import API_BASE_URL from "config";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFriends } from "state";

const FriendListWidget = ({ userId }) => {
  const dispatch = useDispatch();
  const { palette } = useTheme();
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends || []);
  const friendRequests = useSelector((state) => state.user.friendRequests || []);

  const getFriends = async () => {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/friends`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    dispatch(setFriends({ friends: data }));
  };

  const acceptRequest = async (friendId) => {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/${friendId}/accept`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    dispatch(setFriends({ friends: data }));
  };

  const rejectRequest = async (friendId) => {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/${friendId}/reject`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    dispatch(setFriends({ friends: data }));
  };

  useEffect(() => {
    getFriends();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WidgetWrapper>
      {friendRequests.length > 0 && (
        <>
          <Typography
            color={palette.neutral.dark}
            variant="h5"
            fontWeight="500"
            sx={{ mb: "1.5rem" }}
          >
            Friend Requests
          </Typography>
          <Box display="flex" flexDirection="column" gap="1.5rem" mb="2rem">
            {friendRequests.map((request) => (
              <Box key={request._id} display="flex" alignItems="center" justifyContent="space-between">
                <Friend
                  friendId={request._id}
                  name={`${request.firstName} ${request.lastName}`}
                  subtitle={request.occupation}
                  userPicturePath={request.picturePath}
                />
              </Box>
            ))}
          </Box>
        </>
      )}

      <Typography
        color={palette.neutral.dark}
        variant="h5"
        fontWeight="500"
        sx={{ mb: "1.5rem" }}
      >
        Friend List
      </Typography>
      <Box display="flex" flexDirection="column" gap="1.5rem">
        {friends.map((friend) => (
          <Friend
            key={friend._id}
            friendId={friend._id}
            name={`${friend.firstName} ${friend.lastName}`}
            subtitle={friend.occupation}
            userPicturePath={friend.picturePath}
          />
        ))}
      </Box>
    </WidgetWrapper>
  );
};

export default FriendListWidget;