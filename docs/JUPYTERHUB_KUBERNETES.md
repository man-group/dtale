# Using D-Tale within JupyterHub & Kubernetes

Because D-Tale exposes its own web service (through use of Flask), which is in addition to the one
that is serving the jupyter notebook, the port that D-Tale is running on (usually 40000) must be
exposed to users outside of the cluster.

Implementation of the cluster can vary but here is some background on the implementation we used:
- create a `k8s Service`, pointing to the D-Tale port (usually 40000) on the Pods (Pod can be created by Deployment,
StatefulSet, whatever)
- create a k8s Ingress, pointing to the Service we created above (this allows you to host multiple http/https services with only one public IP)
  - for `k8s Ingress` take a look at when they list [here](https://kubernetes.io/docs/concepts/services-networking/ingress/)
  - you must configure it ahead of time for which port you D-Tale to run on
  - FYI: we went with traefik.io (think of it as a cluster-wide Nginx reverse proxy)
- make sure when setting up the multiple target ports use different values for the notebook and D-Tale `port`. Here's an example (this was supported by k8s as `multi-port services`)
```
ports:
  - name: http-notebook
    port: 80
    protocol: TCP
    targetPort: 8888
  - name: http-notebook-dtale
    port: 40000
    protocol: TCP
    targetPort: 40000
```

*DISCLAIMER: the Service and Ingress here are created by our own code-tweaked version of JupyterHub*

So in the end, simply treat D-Tale as just a normal web service and expose it in the same way you
expose all other web services on the cluster.

**D-Tale port discovery**

By default, D-Tale will start searching for an open port at 40000 and go until it hits 49000 before it decides that
there are no ports open.  If you would like to narrow this range down or use a different range you can do so by specifying
these environment variables:
 - `DTALE_MIN_PORT` (default is 40000)
 - `DTALE_MAX_PORT` (default is 49000)
 
**How D-Tale will need to work under this configuration (IMPORTANT)**

- When users will open their first notebook and call `dtale.show` it will try to open an instance at port 40000
(or whatever you specified in `DTALE_MIN_PORT`), ideally this would be the port you used for `k8s Ingress`
- When users open a 2nd notebook and call `dtale.show` it will try to open an instance at port 40001
(or `DTALE_MIN_PORT + 1`) and thus won't be visible to the outside world unless you create multiple `k8s Ingress`
- The way around this behavior would be to force D-Tale to open on a specific port by doing `dtale.show(df, port=[40000 or DTALE_MIN_PORT], force=True)`
this will kill the previous instance running at 40000 (`DTALE_MIN_PORT`) and replace it with this instance
*hopefully this scenario won't get hit very often, it hasn't for us*

**Sample Issue Threads**
- [Failed to connect D-Tale process in hosted notebook](https://github.com/man-group/dtale/issues/95)
