export const loginPortals = ['/login', '/lecturer-login', '/admin-login']
export const loginPortalStorageKey = 'eph_login_portal'

export function saveLoginPortal(pathname) {
  if (loginPortals.includes(pathname)) {
    localStorage.setItem(loginPortalStorageKey, pathname)
  }
}

export function getLoginPortal() {
  const savedPortal = localStorage.getItem(loginPortalStorageKey)
  return loginPortals.includes(savedPortal) ? savedPortal : '/login'
}
