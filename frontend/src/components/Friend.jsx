import { PersonAddOutlined, PersonRemoveOutlined, CancelOutlined, CheckCircleOutline } from "@mui/icons-material";
import API_BASE_URL from "config";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setFriends } from "state";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";
import ProfileCardPopover from "components/ui/profile-card-popover";

const Friend = ({ friendId, name, subtitle, userPicturePath }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends);

  const { palette } = useTheme();
  const primaryLight = palette.primary.light;
  const primaryDark = palette.primary.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;

  const isFriend = Array.isArray(friends) ? friends.find((friend) => friend._id === friendId) : false;
  const sentFriendRequests = useSelector((state) => state.user.sentFriendRequests || []);
  const friendRequests = useSelector((state) => state.user.friendRequests || []);
  
  const hasSentRequest = Array.isArray(sentFriendRequests) ? sentFriendRequests.find((req) => req._id === friendId) : false;
  const hasReceivedRequest = Array.isArray(friendRequests) ? friendRequests.find((req) => req._id === friendId) : false;
  
  const isOwnPost = friendId === _id; // Don't show add/remove button for own posts

  const patchFriend = async () => {
    const response = await fetch(
      `${API_BASE_URL}/users/${_id}/${friendId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    dispatch(setFriends({ friends: data }));
  };

  const acceptFriend = async () => {
    const response = await fetch(
      `${API_BASE_URL}/users/${_id}/${friendId}/accept`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    dispatch(setFriends({ friends: data }));
  };

  const rejectFriend = async () => {
    const response = await fetch(
      `${API_BASE_URL}/users/${_id}/${friendId}/reject`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    dispatch(setFriends({ friends: data }));
  };

  return (
    <FlexBetween>
      <FlexBetween gap="1rem">
        <UserImage image={userPicturePath} size="55px" />
        <Box
          onClick={() => {
            navigate(`/profile/${friendId}`);
            navigate(0);
          }}
        >
          <ProfileCardPopover userId={friendId}>
            <Typography
              color={main}
              variant="h5"
              fontWeight="500"
              sx={{
                "&:hover": {
                  color: palette.primary.light,
                  cursor: "pointer",
                },
              }}
            >
              {name}
            </Typography>
          </ProfileCardPopover>
          <Typography color={medium} fontSize="0.75rem">
            {subtitle}
          </Typography>
        </Box>
      </FlexBetween>

      {/* Don't show friend/unfriend button on own posts */}
      {!isOwnPost && (
        <FlexBetween gap="0.5rem">
          {hasReceivedRequest ? (
            <>
              <IconButton
                onClick={() => acceptFriend()}
                sx={{ backgroundColor: primaryLight, p: "0.6rem" }}
              >
                <CheckCircleOutline sx={{ color: primaryDark }} />
              </IconButton>
              <IconButton
                onClick={() => rejectFriend()}
                sx={{ backgroundColor: palette.error ? palette.error.light : "#ffebee", p: "0.6rem" }}
              >
                <CancelOutlined sx={{ color: palette.error ? palette.error.dark : "#c62828" }} />
              </IconButton>
            </>
          ) : (
            <IconButton
              onClick={() => patchFriend()}
              sx={{ backgroundColor: primaryLight, p: "0.6rem" }}
            >
              {isFriend ? (
                <PersonRemoveOutlined sx={{ color: primaryDark }} />
              ) : hasSentRequest ? (
                <CancelOutlined sx={{ color: primaryDark }} />
              ) : (
                <PersonAddOutlined sx={{ color: primaryDark }} />
              )}
            </IconButton>
          )}
        </FlexBetween>
      )}
    </FlexBetween>
  );
};

export default Friend;