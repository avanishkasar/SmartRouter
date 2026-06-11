import os

print("Cwd:", os.getcwd())
print("Files in Cwd:", os.listdir('.'))
if os.path.exists("smartroute.db"):
    print("smartroute.db exists in Cwd. Size:", os.path.getsize("smartroute.db"), "bytes")
else:
    print("smartroute.db does not exist in Cwd!")
