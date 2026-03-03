import { Box } from "@mui/material";
import { styled } from "@mui/system";

const WidgetWrapper = styled(Box)(({ theme }) => ({
  padding: "1.5rem 1.5rem 0.75rem 1.5rem",
  backgroundColor: theme.palette.background.alt,
  borderRadius: "1rem", // slightly softer radius
  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)", // modern elevation
}));

export default WidgetWrapper;