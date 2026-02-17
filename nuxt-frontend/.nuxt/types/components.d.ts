
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T

interface _GlobalComponents {
  AppHeader: typeof import("../../components/AppHeader.vue")['default']
  LoginView: typeof import("../../components/LoginView.vue")['default']
  AdminActiveRacesSection: typeof import("../../components/admin/AdminActiveRacesSection.vue")['default']
  AdminCarsCard: typeof import("../../components/admin/AdminCarsCard.vue")['default']
  AdminOverviewCard: typeof import("../../components/admin/AdminOverviewCard.vue")['default']
  AdminRaceDetailsSection: typeof import("../../components/admin/AdminRaceDetailsSection.vue")['default']
  AdminRaceHistorySection: typeof import("../../components/admin/AdminRaceHistorySection.vue")['default']
  AdminUsersCard: typeof import("../../components/admin/AdminUsersCard.vue")['default']
  RaceAdminControlsCard: typeof import("../../components/race/RaceAdminControlsCard.vue")['default']
  RaceAdminRegisterCarCard: typeof import("../../components/race/RaceAdminRegisterCarCard.vue")['default']
  RaceHeader: typeof import("../../components/race/RaceHeader.vue")['default']
  RaceLogsCard: typeof import("../../components/race/RaceLogsCard.vue")['default']
  RaceResultsCard: typeof import("../../components/race/RaceResultsCard.vue")['default']
  RaceStatusAndCarsCard: typeof import("../../components/race/RaceStatusAndCarsCard.vue")['default']
  RaceUserRegisterCarCard: typeof import("../../components/race/RaceUserRegisterCarCard.vue")['default']
  UiButton: typeof import("../../components/ui/Button.vue")['default']
  UiCard: typeof import("../../components/ui/Card.vue")['default']
  UiTextField: typeof import("../../components/ui/TextField.vue")['default']
  UserCreateCarForm: typeof import("../../components/user/CreateCarForm.vue")['default']
  UserJoinLiveRaceCard: typeof import("../../components/user/JoinLiveRaceCard.vue")['default']
  UserMyCarsTable: typeof import("../../components/user/MyCarsTable.vue")['default']
  UserProfileCard: typeof import("../../components/user/UserProfileCard.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtImg: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  NuxtPage: typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']
  NoScript: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyAppHeader: LazyComponent<typeof import("../../components/AppHeader.vue")['default']>
  LazyLoginView: LazyComponent<typeof import("../../components/LoginView.vue")['default']>
  LazyAdminActiveRacesSection: LazyComponent<typeof import("../../components/admin/AdminActiveRacesSection.vue")['default']>
  LazyAdminCarsCard: LazyComponent<typeof import("../../components/admin/AdminCarsCard.vue")['default']>
  LazyAdminOverviewCard: LazyComponent<typeof import("../../components/admin/AdminOverviewCard.vue")['default']>
  LazyAdminRaceDetailsSection: LazyComponent<typeof import("../../components/admin/AdminRaceDetailsSection.vue")['default']>
  LazyAdminRaceHistorySection: LazyComponent<typeof import("../../components/admin/AdminRaceHistorySection.vue")['default']>
  LazyAdminUsersCard: LazyComponent<typeof import("../../components/admin/AdminUsersCard.vue")['default']>
  LazyRaceAdminControlsCard: LazyComponent<typeof import("../../components/race/RaceAdminControlsCard.vue")['default']>
  LazyRaceAdminRegisterCarCard: LazyComponent<typeof import("../../components/race/RaceAdminRegisterCarCard.vue")['default']>
  LazyRaceHeader: LazyComponent<typeof import("../../components/race/RaceHeader.vue")['default']>
  LazyRaceLogsCard: LazyComponent<typeof import("../../components/race/RaceLogsCard.vue")['default']>
  LazyRaceResultsCard: LazyComponent<typeof import("../../components/race/RaceResultsCard.vue")['default']>
  LazyRaceStatusAndCarsCard: LazyComponent<typeof import("../../components/race/RaceStatusAndCarsCard.vue")['default']>
  LazyRaceUserRegisterCarCard: LazyComponent<typeof import("../../components/race/RaceUserRegisterCarCard.vue")['default']>
  LazyUiButton: LazyComponent<typeof import("../../components/ui/Button.vue")['default']>
  LazyUiCard: LazyComponent<typeof import("../../components/ui/Card.vue")['default']>
  LazyUiTextField: LazyComponent<typeof import("../../components/ui/TextField.vue")['default']>
  LazyUserCreateCarForm: LazyComponent<typeof import("../../components/user/CreateCarForm.vue")['default']>
  LazyUserJoinLiveRaceCard: LazyComponent<typeof import("../../components/user/JoinLiveRaceCard.vue")['default']>
  LazyUserMyCarsTable: LazyComponent<typeof import("../../components/user/MyCarsTable.vue")['default']>
  LazyUserProfileCard: LazyComponent<typeof import("../../components/user/UserProfileCard.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
