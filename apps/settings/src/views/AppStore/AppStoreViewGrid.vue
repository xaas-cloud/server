<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { useCurrentCategory } from '../../composables/useCurrentCategory'
import { useAppStoreSearchStore } from '../../store/appStoreSearch'
import { useAppStore } from '../../store/appStore'
import AppItem from '../../components/AppStore/AppItem/AppItem.vue'

const store = useAppStore()
const searchStore = useAppStoreSearchStore()
const { currentCategory } = useCurrentCategory()

const apps = computed(() => store.getAppsByCategory(currentCategory.value).filter(searchStore.filterAppsByQuery))

const listElement = ref<HTMLUListElement>()
const { width: containerWidth } = useElementSize(listElement)

const itemWidth = computed(() => {
	if (containerWidth.value >= 1400) {
		return '25%'
	} else if (containerWidth.value >= 900) {
		return '33%'
	} else if (containerWidth.value >= 600) {
		return '50%'
	} else {
		return '100%'
	}
})
</script>

<template>
	<TransitionGroup ref="listElement"
		name="grid-transition"
		tag="ul"
		class="app-store-view-grid">
		<AppItem v-for="app in apps"
			:key="app.id"
			:app="app"
			:category="currentCategory"
			class="app-store-view-grid__item" />
	</TransitionGroup>
</template>

<style scoped lang="scss">
.grid-transition-enter-active, .grid-transition-leave-active {
  transition: all var(--animation-slow);
}
.grid-transition-enter, .grid-transition-leave-to {
  opacity: 0;
  transform: scale(.8);
}

.app-store-view-grid {
	display: flex;
	flex-wrap: wrap;
	gap: var(--default-grid-baseline);
	padding: var(--app-navigation-padding);
	width: 100%;

	&__item {
		width: calc(v-bind('itemWidth') - var(--default-grid-baseline));
	}
}
</style>
