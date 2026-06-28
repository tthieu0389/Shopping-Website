exports.seed = async function (knex) {
  const data = [
    {
      name: "Router & Modem",
      slug: "router-modem",
      description: "Thiết bị phát wifi, modem ADSL, modem quang VNPT",
    },
    {
      name: "Camera An Ninh",
      slug: "camera-an-ninh",
      description:
        "Camera IP, camera giám sát dành cho gia đình và doanh nghiệp",
    },
    {
      name: "Điện Thoại Bàn",
      slug: "dien-thoai-ban",
      description: "Điện thoại cố định, điện thoại VoIP chất lượng cao",
    },
    {
      name: "Đầu Thu MyTV",
      slug: "dau-thu-mytv",
      description: "Đầu thu truyền hình kỹ thuật số MyTV của VNPT",
    },
    {
      name: "Sim Data",
      slug: "sim-data",
      description: "Sim 4G, 5G với các gói data tốc độ cao",
    },
    {
      name: "Cáp & Đầu Nối",
      slug: "cap-dau-noi",
      description: "Cáp quang, cáp mạng Cat6, đầu nối RJ45 và phụ kiện",
    },
    {
      name: "Thiết Bị Văn Phòng",
      slug: "thiet-bi-van-phong",
      description: "Switch, access point, thiết bị mạng cho doanh nghiệp",
    },
  ];

  await knex("categories").insert(data);
};
