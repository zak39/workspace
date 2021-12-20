/**
 * @copyright Copyright (c) 2017 Arawa
 *
 * @author 2021 Baptiste Fotia <baptiste.fotia@arawa.fr>
 * @author 2021 Cyrille Bollu <cyrille@bollu.be>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import Vue from 'vue'
import Router from 'vue-router'
import { generateUrl } from '@nextcloud/router'
import GroupDetails from './GroupDetails'
import Home from './Home'
import SpaceDetails from './SpaceDetails'
import SpaceTable from './SpaceTable'
import Error403 from './Error403'

Vue.use(Router)

export default new Router({
	mode: 'history',
	base: generateUrl('/apps/workspace/'),
	linkActiveClass: 'active',
	routes: [
		{
			path: '/',
			name: 'home',
			component: Home,
			children: [
				{
					path: '',
					component: SpaceTable,
				},
				{
					path: 'workspace/:space',
					component: SpaceDetails,
				},
				{
					path: 'group/:space/:group',
					component: GroupDetails,
				},
				{
					path: 'unauthorized',
					component: Error403,
				},
			],
		},
	],
})
