<script setup lang="ts">
import Playing from './components/Playing.vue'
import { useRoute } from 'vue-router'
import SearchBar from './components/SearchBar.vue'

const route = useRoute()
</script>

<template>
	<div class="w-screen h-screen overflow-hidden bg-[#191919]">
		<div class="flex flex-col w-full h-full overflow-y-auto pb-24">
			<div class="py-8 px-4 sticky top-0 bg-gradient-to-b from-[#00000080] to-transparent flex justify-between align-center">
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
			<RouterView />
		</div>
		
		<Playing />
	</div>
</template>