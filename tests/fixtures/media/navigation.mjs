// Keep the actual adapter projection explicit; stored public fixtures must
// already satisfy it so administrator configuration never ships with guides.
export function projectPublicMenus(menus) {
  return menus.map(menu => ({
    ...menu,
    positions: menu.positions.filter(position => !position.startsWith("admin-")),
    items: menu.items.filter(item => !item.action?.startsWith("/admin")),
  })).filter(menu => menu.positions.length > 0);
}
export function assertPublicMenus(menus) {
  if (!Array.isArray(menus) || menus.some(menu =>
    !Array.isArray(menu.positions) || menu.positions.some(position => position.startsWith("admin-")) ||
    !Array.isArray(menu.items) || menu.items.some(item =>
      item.action?.startsWith("/admin") || item.label?.trim() === "Management")))
    throw new Error("Published media navigation contains administrator configuration");
}
