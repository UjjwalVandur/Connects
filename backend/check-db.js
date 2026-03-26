import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({ email: String, picturePath: String });
const User = mongoose.model('User', userSchema);

const postSchema = new mongoose.Schema({ description: String, picturePath: String });
const Post = mongoose.model('Post', postSchema);

async function check() {
  const latestUsers = await User.find().sort({_id: -1}).limit(2);
  const latestPosts = await Post.find().sort({_id: -1}).limit(2);
  
  fs.writeFileSync('db.json', JSON.stringify({
    users: latestUsers.map(u => ({ id: u._id, email: u.email, picture: u.picturePath })),
    posts: latestPosts.map(p => ({ id: p._id, desc: p.description, picture: p.picturePath }))
  }, null, 2));

  process.exit(0);
}
check();
