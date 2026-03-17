import { createSlice } from "@reduxjs/toolkit";

const initialState={
    mode:"light",
    user:null,
    token:null,
    posts:[],
};

export const authSlice = createSlice({
    name:"auth",
    initialState,
    reducers:{
       setMode:(state)=>{
        state.mode = state.mode === "light" ? "dark" : "light";
       },
       setLogin:(state,action)=>{
        state.user = action.payload.user;
        state.token = action.payload.token;
       },
       setLogout:(state)=>{
        state.user = null;
        state.token = null;
       },
       setFriends:(state,action)=>{
        if(state.user){
            // Handle both older format (array of friends) and new format (object with arrays)
            if (Array.isArray(action.payload.friends)) {
                state.user.friends = action.payload.friends;
            } else if (action.payload.friends && typeof action.payload.friends === 'object') {
                state.user.friends = action.payload.friends.friends;
                state.user.friendRequests = action.payload.friends.friendRequests || [];
                state.user.sentFriendRequests = action.payload.friends.sentFriendRequests || [];
            }
        }
        else{
            console.error("user friends non-existent :(")
        }
       },
       setPosts:(state,action)=>{
        state.posts = action.payload.posts;
       },
       setPost:(state,action)=>{
        const updatedPost = state.posts.map((post)=>{
            if(post._id === action.payload.post._id) return action.payload.post;
            return post;
        });
        state.posts = updatedPost;
       },
       setSavedPosts:(state,action)=>{
        if(state.user){
            state.user.savedPosts = action.payload.savedPosts;
        }else{
            console.error("user non-existent :(")
        }
       }
    }
})

export const {setMode,setLogin,setLogout,setFriends,setPosts,setPost,setSavedPosts}=authSlice.actions;
export default authSlice.reducer;