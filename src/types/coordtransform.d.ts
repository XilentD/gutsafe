declare module "coordtransform" {
  const coordtransform: {
    wgs84togcj02(lng: number, lat: number): [number, number];
    gcj02towgs84(lng: number, lat: number): [number, number];
    wgs84tobd09(lng: number, lat: number): [number, number];
    bd09towgs84(lng: number, lat: number): [number, number];
    gcj02tobd09(lng: number, lat: number): [number, number];
    bd09togcj02(lng: number, lat: number): [number, number];
  };
  export default coordtransform;
}
