let data = [];
let recovery = [];

module.exports = {
  saveEmail: (email, code, type) => {
    if (type === `recovery`) {
      recovery = recovery.filter((x) => x.email !== email); //del old
      recovery.push({ email, code }); //save
    } else {
      data = data.filter((x) => x.email !== email); //del old
      data.push({ email, code }); //save
    }
    return true;
  },
  getEmailByCode: (code, type) => {
    let entry = null;
    if (type === `recovery`) {
      entry = recovery.find((x) => x.code === code);
    } else {
      entry = data.find((x) => x.code === code);
      data = data.filter((x) => x.code !== code);
    }
    return entry ? entry.email : false;
  },
  deleteEmail: (email, type) => {
    if (type === `recovery`)
      recovery = recovery.filter((x) => x.email !== email);
    else data = data.filter((x) => x.email !== email);
  },
};
