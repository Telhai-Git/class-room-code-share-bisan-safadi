const projects = [
  { id: 1, title: "Portfolio", description: "React + Node Project" },
  { id: 2, title: "Chat App", description: "Built with Socket.IO" }
];

const getProjects = (req, res) => {
  res.json(projects);
};

module.exports = { getProjects };
