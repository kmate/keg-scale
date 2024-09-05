# keg-scale

## TODO

- [ ] Change data stamp format? format time on ui! put into general section?
- [ ] Check if EEPROM is still working / is it normal to get emptied when flashing

## Building

### Platform IO

After entering the directory, just start the IDE:

```
code .
```

Check if you can connect to the board through USB:

```
esptool.py --port /dev/ttyUSB0 chip_id
```

#### OTA

Open TCP port 8266 on host firewall.

Caveat: do not use target "Upload Filesystem Image OTA", just use the non-OTA task from the `ota` environment.

### Web UI

```
cd src/web-ui
npm run build
```
