/** Pristup podacima restorana: spaja restaurant.json i menu.json po slugu. */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Restaurant = CollectionEntry<'restaurants'>;
export type Menu = CollectionEntry<'menus'>;
export type MenuCategory = Menu['data']['categories'][number];
export type MenuItem = MenuCategory['items'][number];

export interface RestaurantWithMenu {
  restaurant: Restaurant;
  menu: Menu;
}

/** Svi aktivni restorani (active: true) s menijima. */
export async function getActiveRestaurantsWithMenus(): Promise<RestaurantWithMenu[]> {
  const [restaurants, menus] = await Promise.all([
    getCollection('restaurants', ({ data }) => data.active),
    getCollection('menus'),
  ]);
  const menuById = new Map(menus.map((m) => [m.id, m]));
  return restaurants.map((restaurant) => {
    const menu = menuById.get(restaurant.id);
    if (!menu) throw new Error(`[BHMeni] Restoran "${restaurant.id}" nema menu.json`);
    return { restaurant, menu };
  });
}

/** Taksonomije kao mape id -> zapis (za prikaz tagova i alergena). */
export async function getTaxonomies() {
  const [tags, allergens] = await Promise.all([getCollection('tags'), getCollection('allergens')]);
  return {
    tags: new Map(tags.map((e) => [e.id, e.data])),
    allergens: new Map(allergens.map((e) => [e.id, e.data])),
  };
}
