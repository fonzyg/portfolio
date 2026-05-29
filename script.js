const filterButtons = document.querySelectorAll(".filter-button");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    projectCards.forEach((card) => {
      const tags = card.dataset.tags?.split(" ") ?? [];
      card.classList.toggle("hidden", filter !== "all" && !tags.includes(filter));
    });
  });
});
