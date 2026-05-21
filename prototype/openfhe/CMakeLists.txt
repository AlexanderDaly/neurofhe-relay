cmake_minimum_required(VERSION 3.16.3)

project(neurofhe_openfhe_demo CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(BUILD_STATIC "Link OpenFHE static libraries when available" OFF)

find_package(OpenFHE CONFIG REQUIRED)

message(STATUS "Found OpenFHE version: ${BASE_OPENFHE_VERSION}")
message(STATUS "OpenFHE include directory: ${OpenFHE_INCLUDE}")
message(STATUS "OpenFHE library directory: ${OpenFHE_LIBDIR}")

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${OpenFHE_CXX_FLAGS}")
set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${OpenFHE_EXE_LINKER_FLAGS}")

include_directories(${OPENMP_INCLUDES})
include_directories(${OpenFHE_INCLUDE})
include_directories(${OpenFHE_INCLUDE}/third-party/include)
include_directories(${OpenFHE_INCLUDE}/core)
include_directories(${OpenFHE_INCLUDE}/pke)
include_directories(${OpenFHE_INCLUDE}/binfhe)

if(UNIX AND NOT APPLE)
  add_link_options(-Wl,--no-as-needed)
endif()

link_directories(${OpenFHE_LIBDIR})
link_directories(${OPENMP_LIBRARIES})

add_executable(openfhe_linear_demo openfhe_linear_demo.cpp)

if(BUILD_STATIC)
  target_link_libraries(openfhe_linear_demo PRIVATE ${OpenFHE_STATIC_LIBRARIES})
else()
  target_link_libraries(openfhe_linear_demo PRIVATE ${OpenFHE_SHARED_LIBRARIES})
endif()
