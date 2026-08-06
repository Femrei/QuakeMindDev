# snakeyaml (pulled in transitively) references java.beans.* classes that
# don't exist on Android; they're only used in reflection-based paths this
# app never exercises, so silence R8 instead of failing the build.
-dontwarn java.beans.BeanInfo
-dontwarn java.beans.FeatureDescriptor
-dontwarn java.beans.IntrospectionException
-dontwarn java.beans.Introspector
-dontwarn java.beans.PropertyDescriptor
