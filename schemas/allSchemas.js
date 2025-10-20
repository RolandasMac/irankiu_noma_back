export const post = {
  title: { type: String, required: true },
  content: { type: String, required: true },
};
export const clients = {
  id: { type: String, required: true },
  name: { type: String, required: true },
  addres: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  pvnNr: { type: String, required: false },
};
export const tools = {
  // tool_id: { type: String, required: true },
  toolName: { type: String, required: true },
  description: { type: [String], required: true },
  images_urls: { type: [String], required: true },
  toolPrice: { type: Number, required: true },
  depozit: { type: Number, required: true },
  rented: { type: Boolean, required: true, default: false },
  rented_until: { type: Date, required: false },
  signs: { type: [String], required: false, default: "" },
  rentPrice: { type: Number, required: true },
};
export const orders = {
  client_id: { type: String, required: true },
  tool_id: { type: String, required: true },
  date: { type: Date, required: true },
  // time: { type: Date, required: true },
  discount: { type: Number, required: true, default: 0 },
  docs_urls: [
    {
      _id: false, // nekuria automatinio _id kiekvienam objektui
      type: { type: String, required: true },
      url: { type: String, required: true },
    },
  ],
  pay_sum: { type: Number, required: true },
  paid: { type: Boolean, required: false },
  date_until: { type: Date, required: true },
  returned: { type: Boolean, required: false },
  depozit: { type: Number, required: false },
  payment_method: { type: String, required: true },
};
export const discounts = {
  tools_id: { type: [String], required: true },
  min_days: { type: Number, required: true },
  max_days: { type: Number, required: true },
  discount: { type: Number, required: true },
  valid_from: { type: Date, required: true },
  valid_until: { type: Date, required: true },
};

export const user = {
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  roles: {
    type: [String],
    required: true,
    default: ["user"],
  },
  phoneNr: {
    type: [String],
    required: false,
  },
  photo: {
    type: String,
    required: false,
  },
  carNr: {
    type: [String],
    required: false,
  },
  lastloggedAt: {
    type: Number,
    required: true,
    default: new Date(),
  },
};
