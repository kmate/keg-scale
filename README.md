# keg-scale

## TODO

- [ ] Check if EEPROM is still working - is it normal to get emptied when flashing?
- [ ] Figure out how to enable `-pedantic-errors` without the libraries causing issues
- [ ] Look for regex `TODO|FIXME` in the code base and resolve all remaining instances

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
