<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import Player from './components/Player.vue'
import PreferencePanel from './components/PreferencePanel.vue'
import { ref } from 'vue'

import LeftArrowIcon from './assets/icons/leftarrow.vue'
// import SearchIcon from './assets/icons/search.vue'
import CorgIcon from './assets/icons/corg.vue'
import { watch } from 'vue'

const presentPreferencePanel = ref(false)

const route = useRoute()
const router = useRouter()

watch(() => presentPreferencePanel, (value) => {
	console.log(value)
})

</script>

<template>
	<div class="w-screen h-screen overflow-hidden bg-[#191919]">
		<div class="flex flex-col w-full h-full overflow-y-auto">
			<div class="py-8 px-4 md:px-8 w-screen bg-gradient-to-b from-[#00000080] to-transparent z-20 absolute top-0">
				<div class="flex justify-between align-center h-[2.625rem] items-center">
					<ul class="flex gap-4" v-if="(() => {
						if (route.path === '/lucky' || route.path === '/library' || route.path === '/') { return true }
						else { return false }
					})()">
						<li>
							<RouterLink to="/">
								<span class="text-4xl"
									:class="route.path === '/' ? 'font-semibold text-white' : 'text-white/50 hover:text-white/80'">浏览</span>
							</RouterLink>
						</li>
						<!-- <li>
							<RouterLink to="/lucky"
								:class="route.path === '/lucky' ? 'font-semibold text-white' : 'text-white/50 hover:text-white/80'">
								<span class="text-4xl">手气不错</span>
							</RouterLink>
						</li> -->
						<li>
							<RouterLink to="/library"
								:class="route.path === '/library' ? 'font-semibold text-white' : 'text-white/50 hover:text-white/80'">
								<span class="text-4xl">收藏库</span>
							</RouterLink>
						</li>
					</ul>

					<div v-else>
						<button
							class="text-white w-9 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center"
							@click="router.back()">
							<LeftArrowIcon :size="4" />
						</button>
					</div>

					<div class="flex gap-2">
						<!-- <button
							class="text-white w-9 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center">
							<SearchIcon :size="4" />
						</button> -->

						<button
							class="text-white w-9 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center"
							@click="presentPreferencePanel = true">
							<CorgIcon :size="4" />
						</button>

						<Player />
					</div>
				</div>
			</div>
			<RouterView />
		</div>
		<PreferencePanel :present="presentPreferencePanel" @dismiss="presentPreferencePanel = false" />
	</div>
</template>