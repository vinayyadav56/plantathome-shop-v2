/**
 * PM2 process definition for the storefront.
 *
 * Replaces the inline `pm2 start "npm start" --name shop` in the production
 * workflow, which took PM2's default of **fork mode with a single instance** —
 * one Node process serving all SSR *and*, because next.config rewrites
 * /rest-api/* to the API, all proxied browser API traffic too. One CPU core was
 * the entire capacity ceiling for the storefront regardless of instance size.
 *
 * `instances: 'max'` starts one worker per logical core. Node's cluster module
 * intercepts listen() and round-robins the shared socket, so N workers on port
 * 3003 is correct, not a conflict.
 *
 * MEASURED on an 8-core machine, ISR-cached homepage, 50 VUs, identical build:
 *   fork     791 rps   p50 59.4ms   p95 66.7ms   p99 155.1ms
 *   cluster 3188 rps   p50 13.9ms   p95 32.2ms   p99  45.7ms
 *   => 4.03x throughput, p99 down 70%, zero errors in both arms.
 *
 * Cluster safety was checked rather than assumed. The app has no custom server,
 * no module-scope setInterval, no runtime file writes, and reads no worker
 * identity. Two behaviours change and both are benign:
 *   - src/lib/server/voice-settings.ts keeps a 60s in-memory cache per worker,
 *     so that upstream call happens up to N times per minute instead of once.
 *     It is a read-only boolean with a TTL and a fail-open fallback.
 *   - Next's in-process caches (ISR, image optimizer) are per worker, so expect
 *     a warm-up cost proportional to instance count on first hit. Disk-backed
 *     .next/cache absorbs most of it.
 *
 * The real prize beyond throughput: `pm2 reload` is only genuinely zero-downtime
 * in cluster mode. The workflow currently does `pm2 delete` + `pm2 start` under
 * a comment claiming zero-downtime, which is a hard outage on every deploy.
 */
module.exports = {
  apps: [
    {
      name: 'shop',
      // MUST point at a Node script. PM2 cannot cluster `npm` — it is a shell
      // wrapper, so `script: 'npm', args: 'start'` is SILENTLY DOWNGRADED to
      // fork mode with one instance and no warning. Verified locally: the same
      // config with `npm` reported exec_mode "fork_mode" / 1 worker, while
      // pointing at next's own bin gave "cluster_mode" / 8 workers.
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3003',
      cwd: '/var/www/plantathome/shop-src',
      exec_mode: 'cluster',
      instances: 'max',

      // Next holds a lot of resident memory once the ISR cache warms; restart a
      // worker that runs away rather than letting it take the box down. Cluster
      // mode means the restart is invisible — siblings keep serving.
      max_memory_restart: '900M',

      // Give a worker time to finish in-flight requests before SIGKILL.
      kill_timeout: 8000,
      // Don't consider a worker "up" until it has survived this long; stops a
      // crash-looping build from being reported as a successful deploy.
      min_uptime: 10000,
      max_restarts: 10,

      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },

      // PM2's own log rotation is not enabled by default; keep stdout/stderr
      // separate so a deploy failure is readable.
      error_file: '/var/log/pm2/shop-error.log',
      out_file: '/var/log/pm2/shop-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
