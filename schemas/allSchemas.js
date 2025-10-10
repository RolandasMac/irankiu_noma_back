// const userInMemberSchemaDefinition = {
//   id: {
//     type: String,
//     required: true,
//   },
//   name: {
//     type: String,
//     required: true,
//   },
// };

// const user = {
//   name: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   roles: {
//     type: [String],
//     required: true,
//     default: ["user"],
//   },
//   phoneNr: {
//     type: [String],
//     required: false,
//   },
//   photo: {
//     type: String,
//     required: false,
//   },
//   carNr: {
//     type: [String],
//     required: false,
//   },
//   lastloggedAt: {
//     type: Number,
//     required: true,
//     default: new Date(),
//   },
// };
// const error = {
//   service: {
//     type: String,
//     required: false,
//   },
//   file: {
//     type: String,
//     required: false,
//   },
//   place: {
//     type: String,
//     required: false,
//   },
//   error: {
//     type: String,
//     required: false,
//   },
//   time: {
//     type: Number,
//     required: false,
//   },
//   reviewed: {
//     type: Boolean,
//     required: true,
//     default: false,
//   },
// };

// const post = {
//   title: {
//     type: String,
//     required: true,
//   },
//   content: {
//     type: String,
//     required: true,
//   },
//   authorName: {
//     type: String,
//     required: true,
//   },
//   authorId: {
//     type: String,
//     required: true,
//   },
//   image: {
//     type: [String],
//   },
// };

// const docs = {
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   type: { type: String, required: true },
//   content: { type: String, required: true },
//   url: { type: [String], default: [] },
//   thumbnailsUrl: { type: [String], default: [] },
//   filePath: { type: String },
//   chunks: [
//     {
//       content: { type: String, required: true },
//       embedding: { type: [Number], required: true },
//     },
//   ],
//   status: {
//     type: String,
//     enum: ["uploaded", "indexed", "error"],
//     default: "uploaded",
//   },
//   createdAt: { type: Date, default: Date.now },
// };

// const vote = {
//   title: {
//     type: String,
//     required: true,
//   },
//   content: {
//     type: String,
//     required: true,
//   },
//   result: [
//     {
//       vote: {
//         type: Boolean,
//         required: true,
//       },
//       subject: {
//         type: String,
//         required: true,
//       },
//       subject_name: {
//         type: String,
//         required: true,
//       },
//       user_id: {
//         type: String,
//         required: true,
//       },
//       user_name: {
//         type: String,
//         required: true,
//       },
//       vote_time: {
//         type: Date,
//         required: true,
//         default: new Date(),
//       },
//       note: {
//         type: String,
//         required: false,
//       },
//     },
//   ],
//   subj_count: {
//     type: Number,
//     required: true,
//   },
//   closed: {
//     type: Boolean,
//     required: true,
//     default: false,
//   },
//   end_time: {
//     type: Date,
//     required: true,
//   },
// };
// const member = {
//   name: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   description: {
//     type: String,
//     required: false,
//   },
//   users: [userInMemberSchemaDefinition],
// };
// const employee = {
//   name: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   surname: {
//     type: String,
//     required: true,
//   },
//   duties: {
//     type: String,
//     required: true,
//   },
//   phone: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//   },
// };

// const chatai = {
//   chatId: { type: String, required: true },
//   role: { type: String, enum: ["user", "assistant"], required: true },
//   content: { type: String, required: true },
// };

// const proposal = {
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   author: { type: String, required: true },
//   authorId: { type: String, required: true },
// };
// const comment = {
//   author: { type: String, required: true },
//   text: { type: String, required: true },
//   authorId: { type: String, required: true },
// };

const post = {
  title: { type: String, required: true },
  content: { type: String, required: true },
};
const clients = {
  id: { type: String, required: true },
  name: { type: String, required: true },
  addres: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
};
const tools = {
  // tool_id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: [String], required: true },
  price: { type: Number, required: true },
  depozit: { type: Number, required: true },
  rented: { type: Boolean, required: true, default: false },
  rented_until: { type: Date, required: false },
};
const orders = {
  client_id: { type: String, required: true },
  tool_id: { type: String, required: true },
  date: { type: Date, required: true },
  // time: { type: Date, required: true },
  discount: { type: Number, required: true },
  docs_urls: { type: [{ String: String }], required: true }, // Gal reikia objekų array. Objektas: dokumento tipas:url
  pay_sum: { type: Number, required: true },
  paid: { type: Boolean, required: true },
  date_until: { type: Date, required: true },
  returned: { type: Boolean, required: true },
};
const discounts = {
  tols_id: { type: [String], required: true },
  min_days: { type: Number, required: true },
  max_days: { type: Number, required: true },
  discount: { type: Number, required: true },
  valid_from: { type: Date, required: true },
  valid_until: { type: Date, required: true },
};
module.exports = {
  post,
  clients,
  tools,
  orders,
  discounts,
};
