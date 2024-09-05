Import("env")

print(env)

def before_buildfs(source, target, env):
    print("Stamping data...")
    env.Execute("echo -n `LC_ALL=en_US.utf8 date -u \"+%a, %d %b %Y %H:%M:%S GMT\"` > data/stamp")

env.AddPreAction("buildfs", before_buildfs)
