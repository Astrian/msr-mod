<script setup lang="ts">
import Playing from './components/Playing.vue'
import { useRoute } from 'vue-router'
import SearchBar from './components/SearchBar.vue'

const route = useRoute()
</script>

<template>
	<div class="w-screen h-screen overflow-hidden bg-[#191919]">
		<div class="flex flex-col w-full h-full overflow-y-auto pb-24">
			<div class="py-8 px-4 md:px-8 sticky top-0 bg-gradient-to-b from-[#00000080] to-transparent z-10">
				<div class="flex justify-between align-center"  v-if="(() => {
					if (route.path === '/lucky' || route.path === '/library' || route.path === '/') { return true }
					else { return false }
				})()">
					<ul class="flex gap-4">
						<li>
							<RouterLink to="/">
								<span class="text-4xl" :class="route.path === '/' ? 'font-semibold text-white' : 'text-white/50 hover:text-white/80'">浏览</span>
							</RouterLink>
						</li>
						<li>
							<RouterLink to="/lucky" :class="route.path === '/lucky'? 'font-semibold text-white' : 'text-white/50 hover:text-white/80'">
								<span class="text-4xl">手气不错</span>
							</RouterLink>
						</li>
						<li>
							<RouterLink to="/library" :class="route.path === '/library'? 'font-semibold text-white' : 'text-white/50 hover:text-white/80'">
								<span class="text-4xl">收藏库</span>
							</RouterLink>
						</li>
					</ul>

					<div>
						<SearchBar />
					</div>
				</div>
				<div class="flex justify-between align-center h-[2.625rem] items-center" v-else>
					<button class="text-white w-8 h-8 bg-white/5 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl" @click="$router.back()">
						<div class="w-4 h-4 mx-auto my-auto">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7.82843 10.9999H20V12.9999H7.82843L13.1924 18.3638L11.7782 19.778L4 11.9999L11.7782 4.22168L13.1924 5.63589L7.82843 10.9999Z"></path></svg>
						</div>
					</button>
				</div>
			</div>
			<RouterView />
		</div>
		
		<Playing />
	</div>
</template>