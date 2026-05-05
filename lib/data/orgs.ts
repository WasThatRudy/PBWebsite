import OrgList from "@/lib/db/models/orgList";
import connectDB from "@/lib/db/connection";

export type OrgTag = "gsoc" | "lfx" | "both" | "none";

let cache: Map<string, OrgTag> | null = null;
let cacheBuiltAt = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function buildCache(): Promise<Map<string, OrgTag>> {
  await connectDB();
  const docs = await OrgList.find({}, { login: 1, programs: 1 }).lean();
  const map = new Map<string, OrgTag>();
  for (const doc of docs) {
    const inGsoc = doc.programs.includes("gsoc");
    const inLfx  = doc.programs.includes("lfx");
    if (inGsoc && inLfx) map.set(doc.login, "both");
    else if (inGsoc)     map.set(doc.login, "gsoc");
    else if (inLfx)      map.set(doc.login, "lfx");
  }
  return map;
}

async function getCache(): Promise<Map<string, OrgTag>> {
  const now = Date.now();
  if (cache && now - cacheBuiltAt < CACHE_TTL_MS) return cache;
  cache = await buildCache();
  cacheBuiltAt = now;
  return cache;
}

export async function refreshOrgTagCache(): Promise<void> {
  cache = await buildCache();
  cacheBuiltAt = Date.now();
}

export async function getOrgTag(orgLogin: string): Promise<OrgTag> {
  const map = await getCache();
  return map.get(orgLogin.toLowerCase()) ?? "none";
}

// Safe only after cache has been warmed — used inside scrape job
export function getOrgTagSync(orgLogin: string): OrgTag {
  if (!cache) return "none";
  return cache.get(orgLogin.toLowerCase()) ?? "none";
}

// Seed data — used once by POST /api/orglists { action: "seed" }
export const GSOC_ORGS_SEED: string[] = [
  "aossie","apache","ardupilot","astropy","asyncapi","backstage","beagleboard","bitcoin",
  "blender","boost-ext","borgbackup","catrobat","cbioportal","ccextractor","ceph",
  "chaos-mesh","chapel-lang","checkstyle","chromium","circt","cloudcvcloud","cncf",
  "cockroachdb","codemirror","conda-forge","coreboot","coronasafe","crystal-lang","cupy",
  "dart-lang","dbpedia","debian","delta-io","django","drupal","easybuilders","elastic",
  "emscripten-core","envoyproxy","erpnext","ffmpeg","flask","flutter","foreman-project",
  "fossasia","freebsd","freecad","gentoo","geonetwork","geopandas","gimp","git","gnome",
  "gnu","godotengine","goharbor","golang","grafana","grpc","haiku","haskell","hedgedoc",
  "homebrew","inkscape","intermine","jabref","jboss","jenkins","joomla","jquery",
  "julialang","jupyter","kde","kedro-org","keras-team","kubeedge","kubeflow","kubeovn",
  "kubernetes","lfortran","libgit2","libreoffice","litmuschaos","llvm","mariadb",
  "matplotlib","mattermost","mdanalysis","mercurial","metabrainz","mindsdb","mlpack",
  "moby","moodle","mozilla","nativescript","netbsd","networkx","nodejs","numfocus",
  "numpy","open-mpi","open-policy-agent","openapitools","openastronomy","opencv",
  "openfoodfacts","openmc-dev","openmrs","openprinting","openrefine","openscad",
  "openstreetmap","opensuse","opentelemetry","openwisp","oppia","osgeo",
  "palisadoes-foundation","pandas-dev","performancecopilot","php","pitivi","plone",
  "postgresql","postman","processing","processing-foundation","processwire","publiclab",
  "pylons","pypa","pypy","pytest-dev","python","pytorch","qemu","quarkusio","r-devel",
  "radare","reactos","redhenlab","robocomp","robolectric","rocket-chat","rook","ros",
  "rstudio","rtems","ruby","rust-lang","sagemath","scala","scikit-image","scikit-learn",
  "scipy","sciruby","shogun-toolbox","sigstore","sourceforge","spdx","spiffe",
  "statsmodels","sugarlabs","swift","sympy","tardis-sn","telepresenceio","tensorflow",
  "the-algorithms","theupdateframework","thunderbird","tikv","tor","ubuntu","videolan",
  "vim","vitejs","vlang","vlc","volcano-sh","wasmcloud","weaveworks","webpack",
  "wikimedia","wireshark","wordpress","wxwidgets","xapian","xfce","xorg","xwiki",
  "zephyrproject-rtos","zopefoundation","zulip","circuitverse","stichting-su2","humanai",
  "kiwix","neovim","jpf","owasp","mesa","openrobotics","gazebo","linux","incf",
  "organicmaps","apndash","crowdin","invesalius","ioos",
];

export const LFX_ORGS_SEED: string[] = [
  "amundsen-io","antrea-io","argoproj","automotive-grade-linux","backstage","buildpacks",
  "cert-manager","cilium","cloudevents","clusternet","clusterpedia-io","cncf","containerd",
  "coredns","cortexproject","crossplane","cubesql","dapr","dexidp","emissary-ingress",
  "envoyproxy","etcd-io","falcosecurity","fluid-cloudnative","fluxcd","goharbor","grpc",
  "hyperledger","hyperledger-labs","in-toto","inspektor-gadget","istio","jaegertracing",
  "karmada-io","keda","keptn","knative","konveyor","kube-rs","kubean-io","kubearchive",
  "kubearmor","kubeedge","kubeovn","kubernetes","kubernetes-client","kubernetes-sigs",
  "kubesphere","kubevela","kubevirt","kubewarden","kyverno","layer5io",
  "lf-decentralized-trust","lf-edge","lfai","lfnetworking","lima-vm","linkerd",
  "litmuschaos","longhorn","merbridge","meshery","metal3-io","milvus-io","nats-io",
  "notaryproject","o-ran-sc","onap","opa","open-cluster-management","open-policy-agent",
  "open-telemetry","opencontainers","opendaylight","openebs","openfeature","openfunction",
  "openkruise","opentelemetry","oras-project","porter-dev","projectcontour","prometheus",
  "rook","score-spec","spiffe","strimzi","telepresenceio","thanos-io","theupdateframework",
  "tikv","tremor-rs","vitessio","volcano-sh","wasmcloud","weaveworks","zephyrproject-rtos",
  "cloudnativepg","erddap","p4lang","emscripten","keploy","nvlabs","json-schema",
  "deepchem","pandas","mllam","qc-dev","juliagpu","wasmedge","ga4gh","emory-bmi",
  "dlang","fortran-lang","keras","kro","kcl","stdlib","rustpython","rubygems",
  "holmesgpt","alphaonelabs","c2si","kornia","openafs","tscircuit","mcp-use","ocf",
  "vllm","huggingface","apache-dubbo","kubelinter","d4cg","gradle","hiero-consensus-node",
  "hiero-mirror-node","cedana","checkpoint-restore","contour","flare","requestly",
  "maxun","docker-imagemagick","rspamd","open-telemetry","dicedb","tldr-pages",
  "pvot-oss","thanos","pybamm","cyclonedx","fireform","tiled","prometheus-operator",
];