import Mapbox from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN } from './env';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default Mapbox;

export { MAPBOX_ACCESS_TOKEN };